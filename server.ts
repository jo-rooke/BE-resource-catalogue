import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);

// Making sure that the connection is established successfully before the first http request is made
client.connect().then(() => {
  //Start the server on the given port
  const port = process.env.PORT;
  if (!port) {
    throw "Missing PORT environment variable.  Set it in .env file.";
  }
  app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
  });

  //GET
  // app.get("/", async (req, res) => {
  // });

  // GET /users
  app.get("/users", async (req, res) => {
    const dbres = await client.query("select * from users");
    const userList = dbres.rows;
    res.status(200).json({
      status: "success",
      data: {
        userList: userList,
      },
    });
  });

  app.get("/tags", async (req, res) => {
    const text = "select * from tag_names";
    const dbres = await client.query(text);
    res.status(200).json({
      status: "success",
      data: dbres.rows,
    });
  });

  // GET /comments/:resourceId
  app.get<{ resourceId: number }, {}, {}>(
    "/comments/:resourceId",
    async (req, res) => {
      const resourceId = req.params.resourceId;
      const query1 = "SELECT * FROM resources WHERE id = $1";
      const dbres1 = await client.query(query1, [resourceId]);
      if (dbres1.rowCount === 0) {
        res.status(404).json({
          status: "failed",
          message: "Resource not found.",
        });
      } else {
        const query2 =
          "SELECT feedback.id, feedback.liked, feedback.comment, users.name FROM feedback JOIN users ON feedback.user_id = users.id WHERE resource_id = $1";
        const dbres2 = await client.query(query2, [resourceId]);
        res.status(200).json({
          status: "success",
          data: dbres2.rows,
        });
      }
    }
  );

  // GET /tags/:resourceId
  app.get<{ resourceId: number }, {}, {}>(
    "/tags/:resourceId",
    async (req, res) => {
      const resourceId = req.params.resourceId;
      const query1 = "SELECT * FROM resources WHERE id = $1";
      const dbres1 = await client.query(query1, [resourceId]);
      if (dbres1.rowCount === 0) {
        res.status(404).json({
          status: "failed",
          message: "Resource not found.",
        });
      } else {
        const query2 =
          "SELECT tag_names.id, tag_names.name FROM tags JOIN tag_names ON tags.tag_id = tag_names.id WHERE tags.resource_id = $1";
        const dbres2 = await client.query(query2, [resourceId]);
        res.status(200).json({
          status: "success",
          data: dbres2.rows,
        });
      }
    }
  );
});
