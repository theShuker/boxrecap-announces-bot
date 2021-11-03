const sequelize = require('./connect')
const models = require('./models')

async function start(){
    try {
        console.log('Connecting to db')
        await sequelize.authenticate()
        await sequelize.sync()
        console.log('Connection has been established successfully.')
    } catch (error) {
        console.error('Unable to connect to the database:', error)
    }
}

module.exports = sequelize