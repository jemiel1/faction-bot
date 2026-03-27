// Event Configuration

const eventConstants = {
    classLimits: {
        warrior: 5,
        mage: 3,
        archer: 4
    },
    allowedRoles: [
        'admin',
        'moderator',
        'member'
    ],
    cooldownSettings: {
        defaultCooldown: 3000, // in milliseconds
        specialAbilityCooldown: 15000
    }
};

module.exports = eventConstants;