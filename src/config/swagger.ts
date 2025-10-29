import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Employment Platform API',
    version: '1.0.0',
    description: 'Comprehensive API for global employment and relocation platform',
    contact: {
      name: 'API Support',
      email: 'support@employmentplatform.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
      description: 'Development server',
    },
    {
      url: 'https://api.employmentplatform.com/api/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        required: ['email', 'name', 'role'],
        properties: {
          _id: {
            type: 'string',
            description: 'User ID',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          name: {
            type: 'string',
            description: 'User full name',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin', 'company'],
            description: 'User role',
          },
          profileCompleted: {
            type: 'boolean',
            description: 'Profile completion status',
          },
          assessmentCompleted: {
            type: 'boolean',
            description: 'Assessment completion status',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Job: {
        type: 'object',
        required: ['title', 'company', 'location', 'salary', 'type', 'category'],
        properties: {
          _id: {
            type: 'string',
            description: 'Job ID',
          },
          title: {
            type: 'string',
            description: 'Job title',
          },
          company: {
            type: 'string',
            description: 'Company name',
          },
          location: {
            type: 'string',
            description: 'Job location',
          },
          salary: {
            type: 'string',
            description: 'Salary range',
          },
          type: {
            type: 'string',
            enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
            description: 'Job type',
          },
          category: {
            type: 'string',
            description: 'Job category',
          },
          skills: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Required skills',
          },
          description: {
            type: 'string',
            description: 'Job description',
          },
          requirements: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Job requirements',
          },
          benefits: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Job benefits',
          },
          isActive: {
            type: 'boolean',
            description: 'Job active status',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Application: {
        type: 'object',
        required: ['userId', 'jobId', 'status'],
        properties: {
          _id: {
            type: 'string',
            description: 'Application ID',
          },
          userId: {
            type: 'string',
            description: 'User ID',
          },
          jobId: {
            type: 'string',
            description: 'Job ID',
          },
          status: {
            type: 'string',
            enum: ['pending', 'reviewing', 'interview', 'offer', 'accepted', 'rejected'],
            description: 'Application status',
          },
          coverLetter: {
            type: 'string',
            description: 'Cover letter',
          },
          resume: {
            type: 'string',
            description: 'Resume file URL',
          },
          appliedAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Assessment: {
        type: 'object',
        required: ['userId', 'score', 'completedAt'],
        properties: {
          _id: {
            type: 'string',
            description: 'Assessment ID',
          },
          userId: {
            type: 'string',
            description: 'User ID',
          },
          score: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Assessment score',
          },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string' },
                answer: { type: 'string' },
                isCorrect: { type: 'boolean' },
              },
            },
            description: 'Assessment answers',
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            description: 'Error message',
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
            description: 'Validation errors',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Success message',
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const specs = swaggerJsdoc(options);

export default specs;