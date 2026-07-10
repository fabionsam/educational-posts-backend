process.env.NODE_ENV = 'test';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const Post = require('../src/models/post');
const User = require('../src/models/user');

let admin, teacher, teacher2, student;
let adminToken, teacherToken, teacherToken2, studentToken;

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production';

beforeAll(async () => {
  // Sync the database schema before running any tests
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  // Clean up database tables before each test to ensure isolation
  // Delete Posts first because of the foreign key constraint
  await Post.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });

  // Create test users
  admin = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'administrador'
  });
  teacher = await User.create({
    name: 'Teacher One',
    email: 'teacher1@test.com',
    password: 'password123',
    role: 'professor'
  });
  teacher2 = await User.create({
    name: 'Teacher Two',
    email: 'teacher2@test.com',
    password: 'password123',
    role: 'professor'
  });
  student = await User.create({
    name: 'Student User',
    email: 'student@test.com',
    password: 'password123',
    role: 'aluno'
  });

  // Generate tokens
  adminToken = jwt.sign({ id: admin.id, name: admin.name, email: admin.email, role: admin.role }, JWT_SECRET);
  teacherToken = jwt.sign({ id: teacher.id, name: teacher.name, email: teacher.email, role: teacher.role }, JWT_SECRET);
  teacherToken2 = jwt.sign({ id: teacher2.id, name: teacher2.name, email: teacher2.email, role: teacher2.role }, JWT_SECRET);
  studentToken = jwt.sign({ id: student.id, name: student.name, email: student.email, role: student.role }, JWT_SECRET);
});

afterAll(async () => {
  // Close the database connection after all tests have completed
  await sequelize.close();
});

describe('Authentication Endpoints', () => {
  describe('POST /auth/register - User Registration', () => {
    it('should successfully register a new user with role aluno by default', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Novo Aluno',
          email: 'novoaluno@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('novoaluno@test.com');
      expect(response.body.role).toBe('aluno');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should register a user with a specific role', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Novo Professor',
          email: 'novoprofessor@test.com',
          password: 'password123',
          role: 'professor'
        });

      expect(response.status).toBe(201);
      expect(response.body.role).toBe('professor');
    });

    it('should return 400 Bad Request if email is already in use', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Duplicado',
          email: 'student@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('in use');
    });

    it('should return 400 Bad Request if required fields are missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'incompleto@test.com'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login - User Login', () => {
    it('should successfully login and return a JWT bearer token', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'teacher1@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('teacher1@test.com');
      expect(response.body.user.role).toBe('professor');
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'teacher1@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });

    it('should return 401 Unauthorized for non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });
  });
});

describe('POST /posts - Create Post', () => {
  it('should successfully create a new post when requested by a professor', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Introdução ao Node.js',
        content: 'Node.js é um runtime JavaScript construído no motor V8 do Chrome.',
        author: 'Prof. Fabio'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Introdução ao Node.js');
    expect(response.body.content).toBe('Node.js é um runtime JavaScript construído no motor V8 do Chrome.');
    expect(response.body.author).toBe('Prof. Fabio');
    expect(response.body.userId).toBe(teacher.id);
  });

  it('should default the author to user name if not provided', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Introdução ao Express',
        content: 'Express é uma framework minimalista para Node.js.'
      });

    expect(response.status).toBe(201);
    expect(response.body.author).toBe(teacher.name);
  });

  it('should allow administrador to create posts', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Post do Admin',
        content: 'Administradores podem fazer tudo.'
      });

    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(admin.id);
  });

  it('should deny access (403) to aluno role', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Tentativa Aluno',
        content: 'Alunos não devem conseguir criar posts.'
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('denied');
  });

  it('should return 401 if token is missing', async () => {
    const response = await request(app)
      .post('/posts')
      .send({
        title: 'Sem Token',
        content: 'Sem token não deve funcionar.'
      });

    expect(response.status).toBe(401);
  });

  it('should return 400 Bad Request if any required field is missing', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Post Incompleto'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('required');
  });

  it('should return 400 Bad Request if any field is an empty string', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: '   ',
        content: 'Conteúdo qualquer'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('cannot be empty');
  });
});

describe('GET /posts - List Posts', () => {
  it('should deny access if token is missing', async () => {
    const response = await request(app).get('/posts');
    expect(response.status).toBe(401);
  });

  it('should return an empty list if there are no posts', async () => {
    const response = await request(app)
      .get('/posts')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('should allow aluno, professor, and administrador to list posts, ordered newest first', async () => {
    // Insert two posts
    const post1 = await Post.create({
      title: 'Primeiro Post',
      content: 'Conteúdo do primeiro post',
      author: 'Professor A',
      userId: teacher.id
    });
    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 100));
    const post2 = await Post.create({
      title: 'Segundo Post',
      content: 'Conteúdo do segundo post',
      author: 'Professor B',
      userId: teacher2.id
    });

    // Check with aluno
    let response = await request(app)
      .get('/posts')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body[0].id).toBe(post2.id);
    expect(response.body[1].id).toBe(post1.id);

    // Check with professor
    response = await request(app)
      .get('/posts')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(response.status).toBe(200);

    // Check with admin
    response = await request(app)
      .get('/posts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
  });
});

describe('GET /posts/:id - Read Single Post', () => {
  it('should return 200 and the post details for an authorized user', async () => {
    const post = await Post.create({
      title: 'Post Específico',
      content: 'Conteúdo específico',
      author: 'Professor C',
      userId: teacher.id
    });

    const response = await request(app)
      .get(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(post.id);
    expect(response.body.title).toBe(post.title);
  });

  it('should return 404 Not Found for a non-existent post ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app)
      .get(`/posts/${fakeId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Post not found.');
  });
});

describe('PUT /posts/:id - Edit Post', () => {
  let post;

  beforeEach(async () => {
    post = await Post.create({
      title: 'Post Inicial',
      content: 'Conteúdo Inicial',
      author: 'Teacher One',
      userId: teacher.id
    });
  });

  it('should successfully update a post when requested by its author (professor)', async () => {
    const response = await request(app)
      .put(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Post Editado',
        content: 'Conteúdo Editado'
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Post Editado');
    expect(response.body.content).toBe('Conteúdo Editado');
    expect(response.body.author).toBe('Teacher One');
  });

  it('should deny update (403) if professor is not the author of the post', async () => {
    const response = await request(app)
      .put(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${teacherToken2}`)
      .send({
        title: 'Tentativa Invasora'
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Access denied');
  });

  it('should allow administrador to update any post', async () => {
    const response = await request(app)
      .put(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Editado pelo Admin'
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Editado pelo Admin');
  });

  it('should deny update (403) to aluno', async () => {
    const response = await request(app)
      .put(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Tentativa Aluno'
      });

    expect(response.status).toBe(403);
  });

  it('should return 404 Not Found when trying to edit a non-existent post', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app)
      .put(`/posts/${fakeId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Novo Título'
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Post not found.');
  });

  it('should return 400 Bad Request if an update field is an empty string', async () => {
    const response = await request(app)
      .put(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: '   '
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('cannot be empty');
  });
});

describe('DELETE /posts/:id - Delete Post', () => {
  let post;

  beforeEach(async () => {
    post = await Post.create({
      title: 'Post para Deletar',
      content: 'Em breve serei apagado',
      author: 'Teacher One',
      userId: teacher.id
    });
  });

  it('should successfully delete a post when requested by its author (professor)', async () => {
    const response = await request(app)
      .delete(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('deleted');

    const checkDb = await Post.findByPk(post.id);
    expect(checkDb).toBeNull();
  });

  it('should deny delete (403) if professor is not the author', async () => {
    const response = await request(app)
      .delete(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${teacherToken2}`);

    expect(response.status).toBe(403);
  });

  it('should allow administrador to delete any post', async () => {
    const response = await request(app)
      .delete(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    const checkDb = await Post.findByPk(post.id);
    expect(checkDb).toBeNull();
  });

  it('should deny delete (403) to aluno', async () => {
    const response = await request(app)
      .delete(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(403);
  });

  it('should return 404 Not Found when trying to delete a non-existent post', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app)
      .delete(`/posts/${fakeId}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Post not found.');
  });
});

describe('GET /posts/search - Search Posts', () => {
  beforeEach(async () => {
    await Post.bulkCreate([
      {
        title: 'Como aprender Javascript',
        content: 'Javascript é muito usado na web.',
        author: 'Professor JS',
        userId: teacher.id
      },
      {
        title: 'Bancos de dados SQL',
        content: 'SQL é usado para interagir com bancos relacionais como o PostgreSQL.',
        author: 'Prof. BD',
        userId: teacher.id
      },
      {
        title: 'Desenvolvimento Backend com Express',
        content: 'Express facilita a criação de rotas de servidor.',
        author: 'Prof. Express',
        userId: teacher2.id
      }
    ]);
  });

  it('should find posts matching search term in title (case-insensitive)', async () => {
    const response = await request(app)
      .get('/posts/search?q=javascript')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('Como aprender Javascript');
  });

  it('should find posts matching search term in content', async () => {
    const response = await request(app)
      .get('/posts/search?query=rotas')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('Desenvolvimento Backend com Express');
  });

  it('should return empty list if no posts match the query', async () => {
    const response = await request(app)
      .get('/posts/search?search=Python')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(0);
  });

  it('should return 400 Bad Request if search query is missing or empty', async () => {
    const response = await request(app)
      .get('/posts/search')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('required');

    const emptyResponse = await request(app)
      .get('/posts/search?q=  ')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(emptyResponse.status).toBe(400);
  });
});

describe('Generic Error handling / Not Found', () => {
  it('should return 404 for undefined routes', async () => {
    const response = await request(app).get('/invalid-route-name');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Endpoint not found.');
  });
});
