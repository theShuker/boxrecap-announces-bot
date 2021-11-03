const { Sequelize, DataTypes, Model } = require('sequelize')
const sequelize = require('./connect')

//
// USER MODEL
//
class User extends Model {}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        vkid: {
            type: DataTypes.INTEGER,
        },
        disabledMessages: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    },
    { sequelize }
)

//
//  MANGA Manga MODEL
//
class Manga extends Model {}

Manga.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        hashtag: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    },
    { sequelize }
)

User.belongsToMany(Manga, { through: 'UserManga' })
Manga.belongsToMany(User, { through: 'UserManga' })

module.exports = {
    User,
    Manga,
}
