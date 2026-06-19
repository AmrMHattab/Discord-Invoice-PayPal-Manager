const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { storage } = require('../modules');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invoices')
        .setDescription('List all invoices')
        .addStringOption(option =>
            option.setName('filter')
                .setDescription('Filter by status')
                .addChoices(
                    { name: 'All', value: 'all' },
                    { name: 'Pending', value: 'pending' },
                    { name: 'Paid', value: 'paid' },
                    { name: 'Cancelled', value: 'cancelled' }
                )
                .setRequired(false)),

    run: async ({ interaction }) => {
        await interaction.deferReply();
        
        try {
            const filter = interaction.options.getString('filter');
            const invoices = await storage.getInvoices(filter);
            
            if (invoices.length === 0) {
                return interaction.editReply('No invoices found.');
            }

            const embed = new EmbedBuilder()
                .setTitle(`🧾 Invoices ${filter ? `(${filter})` : ''}`)
                .setColor('#0070BA');

            const list = invoices.slice(0, 10).map(inv => 
                `**ID**: ${inv.id}\n**Status**: ${inv.status}\n**Amount**: $${inv.amount}\n**User**: <@${inv.userId}>`
            ).join('\n\n');

            embed.setDescription(list);

            if (invoices.length > 10) {
                embed.setFooter({ text: `Showing 10 of ${invoices.length} invoices` });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error listing invoices:', error);
            await interaction.editReply('❌ Failed to fetch invoices from database.');
        }
    }
};
