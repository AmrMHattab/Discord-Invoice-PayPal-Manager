const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { paymentApi, storage } = require('../modules');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check invoice status')
        .addStringOption(option =>
            option.setName('invoice_id')
                .setDescription('Invoice ID to check')
                .setRequired(true)),

    run: async ({ interaction }) => {
        const invoiceId = interaction.options.getString('invoice_id');
        await interaction.deferReply();

        try {
            const status = await paymentApi.getInvoiceStatus(invoiceId);
            
            try {
                await storage.updateInvoiceStatus(invoiceId, status.status);
            } catch (dbError) {
                console.warn('Database update failed:', dbError.message);
            }

            const embed = new EmbedBuilder()
                .setTitle('🧾 Invoice Status')
                .setColor('#0070BA')
                .addFields(
                    { name: '🆔 ID', value: invoiceId, inline: true },
                    { name: '📊 Status', value: status.status, inline: true },
                    { name: '💰 Amount', value: `$${status.amount.value}`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error checking status:', error);
            await interaction.editReply({
                content: '❌ Failed to check invoice status.',
                ephemeral: true
            });
        }
    }
};
