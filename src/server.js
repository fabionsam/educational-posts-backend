const app = require('./app');
const sequelize = require('./config/database');
const User = require('./models/user');

const PORT = process.env.PORT || 3000;

async function seedDefaultUsers() {
  try {
    const demoUsers = [
      {
        name: 'Aluno Demonstração',
        email: 'student@test.com',
        password: 'password123',
        role: 'aluno',
      },
      {
        name: 'Prof. Fabio',
        email: 'teacher1@test.com',
        password: 'password123',
        role: 'professor',
      },
      {
        name: 'Profa. Ana',
        email: 'teacher2@test.com',
        password: 'password123',
        role: 'professor',
      },
      {
        name: 'Administrador',
        email: 'admin@test.com',
        password: 'password123',
        role: 'administrador',
      },
    ];

    for (const u of demoUsers) {
      const exists = await User.findOne({ where: { email: u.email } });
      if (!exists) {
        await User.create(u);
      }
    }
  } catch (err) {
    console.error('Error seeding default users:', err.message);
  }
}

async function startServer() {
  try {
    // Sync models with the database
    await sequelize.sync();
    console.log('Database synced successfully.');

    // Seed default demo users for student, teacher, and admin
    await seedDefaultUsers();

    // Start listening for requests
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start server:', error);
    process.exit(1);
  }
}

startServer();
