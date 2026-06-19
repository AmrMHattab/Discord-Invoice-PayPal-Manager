module.exports = ({ interaction }) => {
    if (interaction.isChatInputCommand()) {
        const authorizedUsers = process.env.ADMINISTRATOR_IDS?.split(',') || [];
        if (authorizedUsers.length > 0 && !authorizedUsers.includes(interaction.user.id)) {
            interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
            return true; // Stop execution
        }
    }
    return false; // Continue execution
};
