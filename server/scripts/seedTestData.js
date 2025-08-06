import mongoose from 'mongoose';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Invoice from '../models/Invoice.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/freelanceflow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedTestData = async () => {
  try {
    console.log('Starting to seed test data...');

    // Find the first user (assuming you're logged in)
    const user = await User.findOne({});
    if (!user) {
      console.error('No user found. Please register/login first.');
      process.exit(1);
    }

    console.log(`Seeding data for user: ${user.email}`);

    // Create test clients
    const clientsData = [
      {
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        company: 'TechCorp Solutions',
        createdBy: user._id
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@innovatestart.com',
        company: 'Innovate Startup',
        createdBy: user._id
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@digitalagency.com',
        company: 'Digital Marketing Agency',
        createdBy: user._id
      },
      {
        name: 'Emily Rodriguez',
        email: 'emily@ecommerceco.com',
        company: 'E-Commerce Co',
        createdBy: user._id
      }
    ];

    // Clear existing test data for this user
    await Client.deleteMany({ createdBy: user._id });
    await Project.deleteMany({ createdBy: user._id });
    await Invoice.deleteMany({ createdBy: user._id });

    // Create clients
    const clients = await Client.insertMany(clientsData);
    console.log(`Created ${clients.length} test clients`);

    // Create test projects
    const projectsData = [
      {
        name: 'Website Redesign',
        clientName: clients[0].name,
        clientId: clients[0]._id,
        status: 'in progress',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        createdBy: user._id
      },
      {
        name: 'Mobile App Development',
        clientName: clients[1].name,
        clientId: clients[1]._id,
        status: 'in progress',
        dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
        createdBy: user._id
      },
      {
        name: 'SEO Optimization',
        clientName: clients[2].name,
        clientId: clients[2]._id,
        status: 'completed',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        createdBy: user._id
      },
      {
        name: 'E-commerce Platform',
        clientName: clients[3].name,
        clientId: clients[3]._id,
        status: 'in progress',
        dueDate: new Date(Date.now() + 140 * 24 * 60 * 60 * 1000), // 140 days from now
        createdBy: user._id
      }
    ];

    const projects = await Project.insertMany(projectsData);
    console.log(`Created ${projects.length} test projects`);

    // Create test invoices
    const invoicesData = [
      {
        invoice_number: 'INV-001',
        title: 'Website Redesign - Phase 1',
        client: {
          id: clients[0]._id,
          name: clients[0].name,
          email: clients[0].email,
          company: clients[0].company,
          address: `${clients[0].address.street}, ${clients[0].address.city}, ${clients[0].address.state} ${clients[0].address.postal_code}`
        },
        project: {
          id: projects[0]._id,
          title: projects[0].name
        },
        issue_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        line_items: [
          {
            description: 'UI/UX Design',
            quantity: 40,
            rate: 125,
            amount: 5000
          },
          {
            description: 'Frontend Development',
            quantity: 60,
            rate: 100,
            amount: 6000
          }
        ],
        subtotal: 11000,
        tax_rate: 8.5,
        tax_amount: 935,
        total_amount: 11935,
        amount_due: 11935,
        status: 'sent',
        createdBy: user._id
      },
      {
        invoice_number: 'INV-002',
        title: 'Mobile App Development - Milestone 1',
        client: {
          id: clients[1]._id,
          name: clients[1].name,
          email: clients[1].email,
          company: clients[1].company,
          address: `${clients[1].address.street}, ${clients[1].address.city}, ${clients[1].address.state} ${clients[1].address.postal_code}`
        },
        project: {
          id: projects[1]._id,
          title: projects[1].name
        },
        issue_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        line_items: [
          {
            description: 'App Architecture & Planning',
            quantity: 30,
            rate: 150,
            amount: 4500
          },
          {
            description: 'iOS Development',
            quantity: 40,
            rate: 125,
            amount: 5000
          }
        ],
        subtotal: 9500,
        tax_rate: 8.5,
        tax_amount: 807.50,
        total_amount: 10307.50,
        amount_paid: 5153.75,
        amount_due: 5153.75, // Partially paid
        status: 'partially_paid',
        payments: [
          {
            amount: 5153.75,
            payment_method: 'stripe',
            transaction_id: 'pi_test_123456',
            payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            notes: 'First milestone payment'
          }
        ],
        createdBy: user._id
      },
      {
        invoice_number: 'INV-003',
        title: 'SEO Optimization - Complete Project',
        client: {
          id: clients[2]._id,
          name: clients[2].name,
          email: clients[2].email,
          company: clients[2].company,
          address: `${clients[2].address.street}, ${clients[2].address.city}, ${clients[2].address.state} ${clients[2].address.postal_code}`
        },
        project: {
          id: projects[2]._id,
          title: projects[2].name
        },
        issue_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (overdue)
        line_items: [
          {
            description: 'SEO Audit & Analysis',
            quantity: 20,
            rate: 100,
            amount: 2000
          },
          {
            description: 'Content Optimization',
            quantity: 25,
            rate: 80,
            amount: 2000
          },
          {
            description: 'Technical SEO Implementation',
            quantity: 15,
            rate: 120,
            amount: 1800
          }
        ],
        subtotal: 5800,
        discount: 580, // 10% discount
        tax_rate: 8.5,
        tax_amount: 443.70,
        total_amount: 5663.70,
        amount_due: 5663.70,
        status: 'overdue',
        createdBy: user._id
      },
      {
        invoice_number: 'INV-004',
        title: 'E-commerce Platform - Initial Setup',
        client: {
          id: clients[3]._id,
          name: clients[3].name,
          email: clients[3].email,
          company: clients[3].company,
          address: `${clients[3].address.street}, ${clients[3].address.city}, ${clients[3].address.state} ${clients[3].address.postal_code}`
        },
        project: {
          id: projects[3]._id,
          title: projects[3].name
        },
        issue_date: new Date(),
        due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        line_items: [
          {
            description: 'Platform Setup & Configuration',
            quantity: 50,
            rate: 120,
            amount: 6000
          },
          {
            description: 'Payment Gateway Integration',
            quantity: 20,
            rate: 150,
            amount: 3000
          },
          {
            description: 'Initial Product Catalog Setup',
            quantity: 15,
            rate: 80,
            amount: 1200
          }
        ],
        subtotal: 10200,
        tax_rate: 8.5,
        tax_amount: 867,
        total_amount: 11067,
        amount_paid: 11067,
        amount_due: 0, // Fully paid
        status: 'paid',
        payments: [
          {
            amount: 11067,
            payment_method: 'bank_transfer',
            transaction_id: 'TXN_789012',
            payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            notes: 'Full payment received via wire transfer'
          }
        ],
        paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdBy: user._id
      },
      {
        invoice_number: 'INV-005',
        title: 'Consulting Services - Q1 2025',
        client: {
          id: clients[0]._id,
          name: clients[0].name,
          email: clients[0].email,
          company: clients[0].company,
          address: `${clients[0].address.street}, ${clients[0].address.city}, ${clients[0].address.state} ${clients[0].address.postal_code}`
        },
        project: {
          id: projects[0]._id,
          title: projects[0].name
        },
        issue_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        line_items: [
          {
            description: 'Strategic Consulting',
            quantity: 20,
            rate: 200,
            amount: 4000
          }
        ],
        subtotal: 4000,
        tax_rate: 8.5,
        tax_amount: 340,
        total_amount: 4340,
        amount_due: 4340,
        status: 'draft',
        createdBy: user._id
      }
    ];

    const invoices = await Invoice.insertMany(invoicesData);
    console.log(`Created ${invoices.length} test invoices`);

    console.log('\n✅ Test data seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   • ${clients.length} clients created`);
    console.log(`   • ${projects.length} projects created`);
    console.log(`   • ${invoices.length} invoices created`);
    console.log('\n🎯 Invoice statuses:');
    console.log(`   • Draft: 1`);
    console.log(`   • Sent: 1`);
    console.log(`   • Partially Paid: 1`);
    console.log(`   • Paid: 1`);
    console.log(`   • Overdue: 1`);
    console.log('\n🚀 You can now test all invoice features!');

  } catch (error) {
    console.error('Error seeding test data:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedTestData();
