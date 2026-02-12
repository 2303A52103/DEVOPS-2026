module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define(
    "Course",
    {
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Title cannot be empty" },
          len: { args: [3, 150], msg: "Title must be 3–150 characters" },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: { args: [0], msg: "Price cannot be negative" } },
      },
      status: {
        type: DataTypes.ENUM("draft", "published", "archived"),
        allowNull: false,
        defaultValue: "draft",
      },
    },
    {
      tableName: "courses",
      timestamps: true,
    }
  );

  return Course;
};