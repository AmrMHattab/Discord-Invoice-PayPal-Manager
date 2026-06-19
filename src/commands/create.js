const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { paymentApi, imageRenderer, storage } = require('../modules');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create a PayPal invoice')
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Invoice amount in USD')
                .setRequired(true)
                .setMinValue(0.01))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Discord user to send invoice to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('service')
                .setDescription('Service or product description')
                .setRequired(true)),

    run: async ({ interaction, client }) => {
        const baseAmount = interaction.options.getNumber('amount');
        const targetUser = interaction.options.getUser('user');
        const service = interaction.options.getString('service');

        const fullUser = await client.users.fetch(targetUser.id);
        const recipientEmail = `${targetUser.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@example.com`;

        const feePercentage = 4.65;
        const staticFee = 0.30;
        const percentageFee = baseAmount * (feePercentage / 100);
        const feeAmount = percentageFee + staticFee;
        const totalAmount = baseAmount + feeAmount;

        await interaction.deferReply();

        try {
            let invoiceCanvas;
            try {
                invoiceCanvas = await imageRenderer.createInvoiceCanvas(totalAmount, service, fullUser);
            } catch (canvasError) {
                console.warn('Canvas creation failed, continuing without image:', canvasError.message);
                invoiceCanvas = null;
            }

            const invoiceData = await paymentApi.createInvoice({
                amount: totalAmount,
                currency: 'USD',
                description: service,
                recipientEmail: recipientEmail
            });

            if (!invoiceData || !invoiceData.id) {
                throw new Error('Invalid invoice response from PayPal');
            }

            try {
                const completeInvoiceData = {
                    id: invoiceData.id,
                    baseAmount: baseAmount,
                    percentageFee: percentageFee,
                    staticFee: staticFee,
                    feeAmount: feeAmount
                };
                
                await storage.saveInvoice({
                    id: invoiceData.id,
                    status: 'DRAFT',
                    amount: totalAmount,
                    userId: targetUser.id,
                    service: service,
                    createdAt: new Date(),
                    ...completeInvoiceData
                });

            } catch (dbError) {
                console.warn('Database save failed:', dbError.message);
            }

            const draftLink = `https://www.paypal.com/invoice/p/#${invoiceData.id}`;

            const embed = new EmbedBuilder()
                .setTitle('🧾 PayPal Invoice Created')
                .setColor('#0070BA')
                .addFields(
                    { name: '👤 To', value: targetUser.toString(), inline: true },
                    { name: '💰 Base Amount', value: `$${baseAmount.toFixed(2)}`, inline: true },
                    { name: '📊 PayPal Fees', value: `$${feeAmount.toFixed(2)}`, inline: true },
                    { name: '💳 Total Required', value: `$${totalAmount.toFixed(2)}`, inline: true },
                    { name: '📦 Service', value: service, inline: true },
                    { name: '🆔 Invoice ID', value: invoiceData.id, inline: true },
                    { name: '🔗 Action Required', value: `[Click here to edit & send invoice](${draftLink})`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Discord PayPal Manager' });

            const replyData = { embeds: [embed] };
            if (invoiceCanvas) {
                const attachment = new AttachmentBuilder(invoiceCanvas, { name: 'invoice.png' });
                embed.setImage('attachment://invoice.png');
                replyData.files = [attachment];
            }

            await interaction.editReply(replyData);

        } catch (error) {
            console.error('Error creating invoice:', error);
            await interaction.editReply({
                content: '❌ Failed to create invoice. Please try again.',
                ephemeral: true
            });
        }
    }
};
