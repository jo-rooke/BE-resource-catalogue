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

  // GET /to-study-list/:userId
  app.get<{ userId: number }, {}, {}>(
    "/to-study-list/:userId",
    async (req, res) => {
      const userId = req.params.userId;
      const query1 =
        "select resources.id, resources.resource_name, resources.author_name from to_study_list join resources on to_study_list.resource_id = resources.id where to_study_list.user_id = $1";
      const dbres1 = await client.query(query1, [userId]);
      const query2 =
        "select to_study_list.resource_id, tag_names.name from to_study_list join tags on to_study_list.resource_id = tags.resource_id join tag_names on tags.tag_id = tag_names.id where to_study_list.user_id = $1";
      const dbres2 = await client.query(query2, [userId]);
      for (const resource of dbres1.rows) {
        const tags = [];
        for (const tag of dbres2.rows) {
          if (resource.id === tag.resource_id) {
            tags.push(tag.name);
          }
        }
        resource.tags = tags;
      }
      res.status(200).json({
        status: "success",
        data: dbres1.rows,
      });
    }
  );

  // POST /to-study-list/:userId
  app.post<{ userId: number }, {}, { resourceId: number }>(
    "/to-study-list/:userId",
    async (req, res) => {
      const userId = req.params.userId;
      const { resourceId } = req.body;
      const query1 =
        "SELECT * FROM to_study_list where user_id = $1 and resource_id = $2";
      const dbres1 = await client.query(query1, [userId, resourceId]);
      if (dbres1.rowCount === 0) {
        const query2 =
          "INSERT INTO to_study_list (user_id, resource_id) values ($1, $2) returning *";
        const dbres2 = await client.query(query2, [userId, resourceId]);
        res.status(201).json({
          status: "success",
          data: dbres2.rows,
        });
      } else {
        res.status(405).json({
          status: "failed",
          message: "Resource is already in the to-study list.",
        });
      }
    }
  );

  // DELETE /to-study-list/:userId
  app.delete<{ userId: number }, {}, { resourceId: number }>(
    "/to-study-list/:userId",
    async (req, res) => {
      const userId = req.params.userId;
      const { resourceId } = req.body;
      const query =
        "DELETE FROM to_study_list WHERE user_id = $1 AND resource_id = $2 RETURNING *";
      const dbres = await client.query(query, [userId, resourceId]);
      if (dbres.rowCount === 0) {
        res.status(404).json({
          status: "failed",
          message: "Resource not found.",
        });
      } else {
        res.status(200).json({
          status: "success",
          data: dbres.rows,
        });
      }
    }
  );

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
