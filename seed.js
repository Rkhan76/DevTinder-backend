const mongoose = require('mongoose');
const User = require('./schema/userSchema');
const Post = require('./schema/postSchema');
const ChatMessage = require('./schema/chatSchema');
const hashPassword = require('./utils/hashedPassword');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB for seeding...');
});

// Dummy user data (excluding superadmin — will add separately)
const dummyUsers = [
  {
    fullName: 'Admin User',
    email: 'admin@devtinder.com',
    password: 'Admin@123',
    role: 'admin',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
  {
    fullName: 'John Doe',
    email: 'john@example.com',
    password: 'Password@123',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    password: 'Password@123',
    image:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  },
  {
    fullName: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'Password@123',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  },
  {
    fullName: 'Sarah Wilson',
    email: 'sarah@example.com',
    password: 'Password@123',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    fullName: 'David Brown',
    email: 'david@example.com',
    password: 'Password@123',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    fullName: 'Emily Davis',
    email: 'emily@example.com',
    password: 'Password@123',
    image:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  },
  {
    fullName: 'Alex Turner',
    email: 'alex@example.com',
    password: 'Password@123',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  },
];

// Dummy posts and chats (same as before)
const dummyPosts = [
  {
    content:
      'Just finished building an amazing React app! #React #JavaScript #WebDev',
    tags: ['React', 'JavaScript', 'WebDev'],
    location: 'San Francisco, CA',
  },
  {
    content:
      'Excited to share my latest full-stack social media platform! #FullStack #NodeJS #MongoDB',
    tags: ['FullStack', 'NodeJS', 'MongoDB'],
    location: 'New York, NY',
  },
  {
    content:
      'Learning TypeScript has been a game-changer for my development workflow. #TypeScript #Programming',
    tags: ['TypeScript', 'Programming'],
    location: 'Austin, TX',
  },
  {
    content:
      'Just deployed my first app to production! #Deployment #Success',
    tags: ['Deployment', 'Success'],
    location: 'Seattle, WA',
  },
  {
    content:
      'Working on a new AI-powered feature for our platform. #AI #MachineLearning #Innovation',
    tags: ['AI', 'MachineLearning', 'Innovation'],
    location: 'Boston, MA',
  },
];

const dummyChats = [
  { message: 'Hey! I saw your post about React. Great work!', status: 'read' },
  { message: "Thanks! I'm really excited about how it turned out.", status: 'read' },
  { message: 'Would you be interested in collaborating on a project?', status: 'delivered' },
  { message: 'Absolutely! That sounds great. What do you have in mind?', status: 'sent' },
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await ChatMessage.deleteMany({});
    console.log('🧹 Cleared existing data');

    // 🔐 Create Superadmin
    const superAdminPassword = await hashPassword('SuperAdmin@123');
    const superAdmin = await User.create({
      fullName: 'Super Admin',
      email: 'superadmin@devtinder.com',
      password: superAdminPassword,
      role: 'superadmin',
      permissions: {
        canDeleteUsers: true,
        canManagePosts: true,
        canCreateAdmins: true,
      },
      image:
        'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop&crop=face',
    });
    console.log('👑 Created Super Admin');

    // 🧑‍💼 Create Admin + Users
    const createdUsers = [];
    for (const userData of dummyUsers) {
      const hashedPassword = await hashPassword(userData.password);
      const createdBy =
        userData.role === 'admin' ? superAdmin._id : null; // Admin created by superadmin
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        createdBy,
      });
      createdUsers.push(user);
      console.log(`👤 Created ${user.role}: ${user.fullName}`);
    }

    // 📝 Create Posts
    const createdPosts = [];
    for (let i = 0; i < dummyPosts.length; i++) {
      const postData = dummyPosts[i];
      const author = createdUsers[i % createdUsers.length];
      const post = await Post.create({
        ...postData,
        author: author._id,
        likesCount: Math.floor(Math.random() * 50),
        commentsCount: Math.floor(Math.random() * 20),
        sharesCount: Math.floor(Math.random() * 10),
      });
      createdPosts.push(post);
      console.log(`📰 Created post: ${post.content.substring(0, 40)}...`);
    }

    // 💬 Create Chat Messages
    for (let i = 0; i < dummyChats.length; i++) {
      const chatData = dummyChats[i];
      const sender = createdUsers[i % createdUsers.length];
      const receiver = createdUsers[(i + 1) % createdUsers.length];
      await ChatMessage.create({
        ...chatData,
        sender: sender._id,
        receiver: receiver._id,
      });
    }

    console.log('💬 Added dummy chat messages');

    // ✅ Completed
    console.log('\n✅ Database seeding completed successfully!');
    console.log(`👑 Super Admin: ${superAdmin.email} / SuperAdmin@123`);
    console.log(`👨‍💼 Admin: admin@devtinder.com / Admin@123`);
    console.log(`👥 Regular Users: use Password@123 for all`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
};

// Run seed
seedDatabase();
