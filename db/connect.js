const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
          require: process.env.NODE_ENV ? true : false,
          rejectUnauthorized: false // <<<<<<< YOU NEED THIS
        }
    },
    logging: false
})

module.exports = sequelize