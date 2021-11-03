const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL + (process.env.NODE_ENV ? '?ssl=true' : ''), {
    dialect: 'postgres',
    logging: false
})

module.exports = sequelize