const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// DATABASE
// ==========================================

require("./config/database");

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const examRoutes = require("./routes/examRoutes");
const questionRoutes = require("./routes/questionRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const userRoutes = require("./routes/userRoutes");
const adminAnalyticsRoutes = require("./routes/adminAnalyticsRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/admin/exams", examRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/admin/exams", questionRoutes);
app.use("/api/exams", attemptRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin/exams",adminAnalyticsRoutes);

// ==========================================
// BASIC ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Quiz API is running"
  });
});

// ==========================================
// SWAGGER DOCUMENTATION
// ==========================================

const swaggerSpec = {
  openapi: "3.0.0",

  info: {
    title: "Quiz API",
    version: "1.0.0",
    description: "Backend API for Quiz Examination System"
  },

  servers: [
    {
      url: `http://localhost:${PORT}`
    }
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },

  paths: {

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    "/api/auth/admin/login": {
      post: {
        tags: ["Authentication"],
        summary: "Admin login",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    example: "admin@quiz.com"
                  },
                  password: {
                    type: "string",
                    example: "admin123"
                  }
                }
              }
            }
          }
        },

        responses: {
          200: {
            description: "Admin login successful"
          },
          401: {
            description: "Invalid credentials"
          }
        }
      }
    },

    "/api/auth/user/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register user",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: {
                    type: "string",
                    example: "Meghanjani"
                  },
                  email: {
                    type: "string",
                    example: "megha@test.com"
                  },
                  password: {
                    type: "string",
                    example: "password123"
                  }
                }
              }
            }
          }
        },

        responses: {
          201: {
            description: "User registered successfully"
          },
          400: {
            description: "Invalid request"
          }
        }
      }
    },

    "/api/auth/user/login": {
      post: {
        tags: ["Authentication"],
        summary: "User login",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    example: "megha@test.com"
                  },
                  password: {
                    type: "string",
                    example: "password123"
                  }
                }
              }
            }
          }
        },

        responses: {
          200: {
            description: "User login successful"
          },
          401: {
            description: "Invalid credentials"
          }
        }
      }
    },

    // ==========================================
    // ADMIN EXAMS
    // ==========================================

    "/api/admin/exams": {
      get: {
        tags: ["Admin Exams"],
        summary: "Get all exams",

        security: [
          {
            bearerAuth: []
          }
        ],

        responses: {
          200: {
            description: "All exams fetched successfully"
          },
          401: {
            description: "Authentication required"
          },
          403: {
            description: "Admin access required"
          }
        }
      },

      post: {
        tags: ["Admin Exams"],
        summary: "Create exam",

        security: [
          {
            bearerAuth: []
          }
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "title",
                  "start_time",
                  "end_time",
                  "duration_minutes"
                ],

                properties: {
                  title: {
                    type: "string",
                    example: "Sunday Aptitude Test"
                  },

                  topic: {
                    type: "string",
                    example: "Number System"
                  },

                  start_time: {
                    type: "string",
                    example: "2026-10-04T18:00:00"
                  },

                  end_time: {
                    type: "string",
                    example: "2026-10-04T18:30:00"
                  },

                  duration_minutes: {
                    type: "integer",
                    example: 20
                  },

                  rules: {
                    type: "string",
                    example: "No negative marking. Do not refresh the page."
                  }
                }
              }
            }
          }
        },

        responses: {
          201: {
            description: "Exam created successfully"
          },
          400: {
            description: "Invalid request"
          }
        }
      }
    },

    // ==========================================
    // UPDATE EXAM
    // ==========================================

    "/api/admin/exams/{id}": {
      put: {
        tags: ["Admin Exams"],
        summary: "Update exam",

        security: [
          {
            bearerAuth: []
          }
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  title: {
                    type: "string",
                    example: "Sunday Aptitude Test Updated"
                  },

                  topic: {
                    type: "string",
                    example: "Number System"
                  },

                  start_time: {
                    type: "string",
                    example: "2026-10-04T18:00:00"
                  },

                  end_time: {
                    type: "string",
                    example: "2026-10-04T18:30:00"
                  },

                  duration_minutes: {
                    type: "integer",
                    example: 20
                  },

                  rules: {
                    type: "string",
                    example: "No negative marking."
                  }
                }
              }
            }
          }
        },

        responses: {
          200: {
            description: "Exam updated successfully"
          },
          404: {
            description: "Exam not found"
          }
        }
      }
    },

    // ==========================================
    // ACTIVE EXAM
    // ==========================================

    "/api/exams/active": {
      get: {
        tags: ["Exams"],
        summary: "Get active exam",

        security: [
          {
            bearerAuth: []
          }
        ],

        responses: {
          200: {
            description: "Active exam fetched successfully"
          },
          404: {
            description: "No active exam"
          }
        }
      }
    },

    // ==========================================
    // GET EXAM BY ID
    // ==========================================

    "/api/exams/{id}": {
      get: {
        tags: ["Exams"],
        summary: "Get exam by ID",

        security: [
          {
            bearerAuth: []
          }
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],

        responses: {
          200: {
            description: "Exam fetched successfully"
          },
          404: {
            description: "Exam not found"
          }
        }
      }
    },

    // ==========================================
    // START EXAM
    // ==========================================

    "/api/exams/{id}/start": {
      post: {
        tags: ["Attempts"],
        summary: "Start exam",

        security: [
          {
            bearerAuth: []
          }
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],

        responses: {
          200: {
            description: "Exam started successfully"
          },
          400: {
            description: "Exam cannot be started"
          },
          409: {
            description: "Exam already attempted"
          }
        }
      }
    },

    // ==========================================
    // SUBMIT EXAM
    // ==========================================

    "/api/exams/{id}/submit": {
      post: {
        tags: ["Attempts"],
        summary: "Submit exam",

        security: [
          {
            bearerAuth: []
          }
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: ["answers"],

                properties: {
                  answers: {
                    type: "array",

                    items: {
                      type: "object",

                      properties: {
                        question_id: {
                          type: "integer",
                          example: 1
                        },

                        selected_answer: {
                          type: "string",
                          example: "B"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },

        responses: {
          200: {
            description: "Exam submitted successfully"
          },
          404: {
            description: "Attempt not found"
          },
          409: {
            description: "Exam already submitted"
          }
        }
      }
    },

    // ==========================================
    // RESULT
    // ==========================================

    "/api/exams/{id}/result": {
      get: {
        tags: ["Results"],
        summary: "Get exam result",

        security: [
          {
            bearerAuth: []
          }
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],

        responses: {
          200: {
            description: "Exam result fetched successfully"
          },
          400: {
            description: "Exam has not been submitted yet"
          },
          404: {
            description: "No result found"
          }
        }
      }
    },

    // ==========================================
    // QUESTIONS
    // ==========================================

    "/api/admin/exams/{examId}/questions": {
      post: {
        tags: ["Questions"],
        summary: "Add question to exam",

        security: [
          {
            bearerAuth: []
          }
        ],

        parameters: [
          {
            name: "examId",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "question_text",
                  "option_a",
                  "option_b",
                  "option_c",
                  "option_d",
                  "correct_answer"
                ],

                properties: {
                  question_text: {
                    type: "string",
                    example: "What is 25% of 200?"
                  },

                  option_a: {
                    type: "string",
                    example: "25"
                  },

                  option_b: {
                    type: "string",
                    example: "50"
                  },

                  option_c: {
                    type: "string",
                    example: "75"
                  },

                  option_d: {
                    type: "string",
                    example: "100"
                  },

                  correct_answer: {
                    type: "string",
                    example: "B"
                  },

                  explanation: {
                    type: "string",
                    example: "25% of 200 = 50."
                  },

                  question_order: {
                    type: "integer",
                    example: 1
                  }
                }
              }
            }
          }
        },

        responses: {
          201: {
            description: "Question added successfully"
          },
          400: {
            description: "Invalid question"
          }
        }
      },

      get: {
        tags: ["Questions"],
        summary: "Get exam questions",

        security: [
          {
            bearerAuth: []
          }
        ],

        parameters: [
          {
            name: "examId",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],

        responses: {
          200: {
            description: "Questions fetched successfully"
          }
        }
      }
    },

    // ==========================================
    // LEADERBOARD
    // ==========================================

    "/api/leaderboard/{examId}": {
      get: {
        tags: ["Leaderboard"],
        summary: "Get exam leaderboard",

        security: [
          {
            bearerAuth: []
          }
        ],

        parameters: [
          {
            name: "examId",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            },

            description: "Exam ID"
          }
        ],

        responses: {
          200: {
            description: "Leaderboard fetched successfully"
          },

          401: {
            description: "Authentication required"
          },

          403: {
            description: "Access denied"
          },

          500: {
            description: "Server error"
          }
        }
      }
    },

    // ==========================================
    // USER PROFILE + ANALYTICS
    // ==========================================

    "/api/user/profile": {
      get: {
        tags: ["User"],
        summary: "Get user profile and overall analytics",

        security: [
          {
            bearerAuth: []
          }
        ],

        responses: {
          200: {
            description:
              "User profile and analytics fetched successfully"
          },

          401: {
            description: "Authentication required"
          },

          403: {
            description: "User access required"
          },

          404: {
            description: "User not found"
          },

          500: {
            description: "Server error"
          }
        }
      }
    },

    // ==========================================
    // TEST ADMIN
    // ==========================================

    "/api/test/admin": {
      get: {
        tags: ["Testing"],
        summary: "Test admin authentication",

        security: [
          {
            bearerAuth: []
          }
        ],

        responses: {
          200: {
            description: "Admin authentication working"
          }
        }
      }
    },

    // ==========================================
    // TEST USER
    // ==========================================

    "/api/test/user": {
      get: {
        tags: ["Testing"],
        summary: "Test user authentication",

        security: [
          {
            bearerAuth: []
          }
        ],

        responses: {
          200: {
            description: "User authentication working"
          }
        }
      }
    }
  }
};

// ==========================================
// SWAGGER UI
// ==========================================

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `Swagger running on http://localhost:${PORT}/api-docs`
  );
});