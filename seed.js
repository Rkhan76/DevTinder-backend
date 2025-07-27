const mongoose = require('mongoose')
const User = require('./schema/userSchema')
const Post = require('./schema/postSchema')
const ChatMessage = require('./schema/chatSchema')
const hashPassword = require('./utils/hashedPassword')
require('dotenv').config()

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once('open', () => {
  console.log('Connected to MongoDB for seeding...')
})

// Dummy user data
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
]

// Dummy post content
const dummyPosts = [
  {
    content:
      'Just finished building an amazing React app! The development journey has been incredible. #React #JavaScript #WebDev',
    tags: ['React', 'JavaScript', 'WebDev'],
    location: 'San Francisco, CA',
  },
  {
    content:
      'Excited to share my latest project - a full-stack social media platform built with Node.js and MongoDB! #FullStack #NodeJS #MongoDB',
    tags: ['FullStack', 'NodeJS', 'MongoDB'],
    location: 'New York, NY',
  },
  {
    content:
      'Learning TypeScript has been a game-changer for my development workflow. The type safety is incredible! #TypeScript #Programming',
    tags: ['TypeScript', 'Programming'],
    location: 'Austin, TX',
  },
  {
    content:
      'Just deployed my first app to production! The feeling of seeing your code live is indescribable. #Deployment #Success',
    tags: ['Deployment', 'Success'],
    location: 'Seattle, WA',
  },
  {
    content:
      'Working on a new AI-powered feature for our platform. Machine learning is fascinating! #AI #MachineLearning #Innovation',
    tags: ['AI', 'MachineLearning', 'Innovation'],
    location: 'Boston, MA',
  },
  {
    content:
      'Team collaboration is key to building great software. Grateful for amazing teammates! #Teamwork #Collaboration',
    tags: ['Teamwork', 'Collaboration'],
    location: 'Chicago, IL',
  },
  {
    content:
      'Just completed a challenging bug fix that took 3 days to solve. The satisfaction is real! #BugFix #ProblemSolving',
    tags: ['BugFix', 'ProblemSolving'],
    location: 'Denver, CO',
  },
  {
    content:
      "Attending my first tech conference next month! Can't wait to network and learn from industry experts. #TechConference #Networking",
    tags: ['TechConference', 'Networking'],
    location: 'Miami, FL',
  },
  {
    content:
      'Open source contribution is so rewarding. Just submitted my first PR to a major project! #OpenSource #Contribution',
    tags: ['OpenSource', 'Contribution'],
    location: 'Portland, OR',
  },
  {
    content:
      'The future of web development is here with WebAssembly and modern frameworks. Exciting times ahead! #WebAssembly #Future',
    tags: ['WebAssembly', 'Future'],
    location: 'Los Angeles, CA',
  },
]

// Dummy chat messages
const dummyChats = [
  {
    message: 'Hey! I saw your post about React. Great work!',
    status: 'read',
  },
  {
    message: "Thanks! I'm really excited about how it turned out.",
    status: 'read',
  },
  {
    message: 'Would you be interested in collaborating on a project?',
    status: 'delivered',
  },
  {
    message: 'Absolutely! That sounds great. What do you have in mind?',
    status: 'sent',
  },
  {
    message: "Hi there! I'm also working on similar tech stack.",
    status: 'read',
  },
  {
    message: "That's awesome! We should definitely connect.",
    status: 'read',
  },
]

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...')

    // Clear existing data
    await User.deleteMany({})
    await Post.deleteMany({})
    await ChatMessage.deleteMany({})
    console.log('Cleared existing data')

    // Create users
    const createdUsers = []
    for (const userData of dummyUsers) {
      const hashedPassword = await hashPassword(userData.password)
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      })
      createdUsers.push(user)
      console.log(`Created user: ${user.fullName}`)
    }

    // Create posts
    const createdPosts = []
    for (let i = 0; i < dummyPosts.length; i++) {
      const postData = dummyPosts[i]
      const author = createdUsers[i % createdUsers.length] // Distribute posts among users

      const post = await Post.create({
        ...postData,
        author: author._id,
        likesCount: Math.floor(Math.random() * 50),
        commentsCount: Math.floor(Math.random() * 20),
        sharesCount: Math.floor(Math.random() * 10),
      })
      createdPosts.push(post)
      console.log(`Created post: ${post.content.substring(0, 50)}...`)
    }

    // Add some likes to posts
    for (const post of createdPosts) {
      const randomUsers = createdUsers
        .filter((user) => user._id.toString() !== post.author.toString())
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 5) + 1)

      post.likedBy = randomUsers.map((user) => user._id)
      await post.save()
    }

    // Add some comments to posts
    for (const post of createdPosts) {
      const commentCount = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < commentCount; i++) {
        const randomUser =
          createdUsers[Math.floor(Math.random() * createdUsers.length)]
        const comments = [
          'Great post!',
          'Thanks for sharing!',
          'This is really helpful!',
          'Awesome work!',
          'Looking forward to more content!',
        ]

        post.comments.push({
          user: randomUser._id,
          text: comments[Math.floor(Math.random() * comments.length)],
        })
      }
      post.commentsCount = post.comments.length
      await post.save()
    }

    // Create friend connections
    const adminUser = createdUsers.find((user) => user.role === 'admin')
    const regularUsers = createdUsers.filter((user) => user.role === 'user')

    // Admin connects with some users
    for (let i = 0; i < 3; i++) {
      const user = regularUsers[i]
      adminUser.connections.push(user._id)
      user.connections.push(adminUser._id)
      await adminUser.save()
      await user.save()
    }

    // Create some friend requests
    for (let i = 3; i < 5; i++) {
      const requester = regularUsers[i]
      const receiver = regularUsers[(i + 1) % regularUsers.length]

      requester.sentFriendRequests.push(receiver._id)
      receiver.receivedFriendRequests.push(requester._id)

      await requester.save()
      await receiver.save()
    }

    // Create chat messages
    for (let i = 0; i < dummyChats.length; i++) {
      const chatData = dummyChats[i]
      const sender = createdUsers[i % createdUsers.length]
      const receiver = createdUsers[(i + 1) % createdUsers.length]

      await ChatMessage.create({
        ...chatData,
        sender: sender._id,
        receiver: receiver._id,
      })
    }

    console.log('Database seeding completed successfully!')
    console.log(`Created ${createdUsers.length} users`)
    console.log(`Created ${createdPosts.length} posts`)
    console.log(`Created ${dummyChats.length} chat messages`)
    console.log('Created friend connections and requests')

    // Display login credentials
    console.log('\n=== Demo Login Credentials ===')
    console.log('Admin:')
    console.log('Email: admin@devtinder.com')
    console.log('Password: Admin@123')
    console.log('\nRegular Users:')
    console.log('Email: john@example.com')
    console.log('Password: Password@123')
    console.log('\n(All users use the same password: Password@123)')
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    mongoose.connection.close()
    console.log('Database connection closed')
  }
}

// Run the seed function
seedDatabase()
