import { Client, RequestParams, ApiResponse } from "@elastic/elasticsearch";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { RequestBody } from "@elastic/elasticsearch/lib/Transport";

const client = new Client({ node: "http://localhost:9200" });

const app = express();

app.use(bodyParser.json());

app.get(
  "/projects",
  async (req: Request<{}, {}, {}, {}>, res: Response<any>) => {
    const doc: RequestParams.Search<Project> = {
      index: "projects",
    };
    try {
      const ret = await client.search<
        SearchResponseBody<Project>,
        Record<string, any>,
        unknown
      >(doc);
      const result: Project[] = ret.body.hits.hits.map((obj) => {
        return obj._source;
      });
      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).send("error");
    }
  }
);

interface SearchResponseBody<T> {
  hits: {
    total: {
      value: number;
      relation: string;
    };
    hits: {
      _index: string;
      _type: string;
      _id: string;
      _score: string;
      _source: T;
    }[];
  };
}

interface Project {
  name: string;
  shareTable: Share[];
}
interface Share {
  user_id: string;
  share: number;
  role: Role;
}
type Role = "worker" | "manager" | "sponsor";

app.post(
  "/projects",
  async (
    req: Request<{}, {}, Project, {}>,
    res: Response<Project | string>
  ) => {
    const doc: RequestParams.Index<Project> = {
      index: "projects",
      body: req.body,
    };
    console.log(req.body);
    try {
      await client.index(doc);
    } catch (e) {
      console.log(e);
      res.status(500).send("error");
    }
    res.json(doc.body);
  }
);

app.listen(8000, () => {
  console.log("listening on port 8000");
});
