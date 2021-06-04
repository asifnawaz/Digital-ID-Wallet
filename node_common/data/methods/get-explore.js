import * as Logging from "~/common/logging";

import { runQuery } from "~/node_common/data/utilities";

export default async ({ earliestTimestamp, latestTimestamp }) => {
  const selectFields = [
    "activity.id",
    "activity.type",
    "activity.createdAt",
    "slates",
    "slate",
    "files",
    "file",
    "users",
    "user",
    "owners",
    "owner",
    "activity",
    "slates",
    "slates.id",
    "activity.slateId",
    "users",
    "users.id",
    "activity.userId",
    "files",
    "files.id",
    "activity.fileId",
    "users",
    "owners",
    "owners.id",
    "activity.ownerId",
  ];
  const selectQuery =
    "SELECT ??, ??, ??, row_to_json(??) as ??, row_to_json(??) as ??, row_to_json(??) as ??, row_to_json(??) as ?? FROM ?? LEFT JOIN ?? ON ?? = ?? LEFT JOIN ?? ON ?? = ?? LEFT JOIN ?? ON ?? = ?? LEFT JOIN ?? AS ?? ON ?? = ??";
  return await runQuery({
    label: "GET_EXPLORE",
    queryFn: async (DB) => {
      let query;
      if (earliestTimestamp) {
        //NOTE(martina): for pagination, fetching the "next 100" results
        let date = new Date(earliestTimestamp);
        date.setSeconds(date.getSeconds() - 1);
        query = await DB.raw(`${selectQuery} WHERE ?? < ?? ORDER BY ?? DESC LIMIT 100`, [
          ...selectFields,
          "activity.createdAt",
          date.toISOString(),
          "activity.createdAt",
        ]);
      } else if (latestTimestamp) {
        //NOTE(martina): for fetching new updates since the last time they loaded
        let date = new Date(latestTimestamp);
        date.setSeconds(date.getSeconds() + 1);
        query = await DB.raw(`${selectQuery} WHERE ?? > ?? ORDER BY ?? DESC LIMIT 100`, [
          ...selectFields,
          "activity.createdAt",
          date.toISOString(),
          "activity.createdAt",
        ]);
      } else {
        //NOTE(martina): for the first fetch they make, when they have not loaded any explore events yet
        query = await DB.raw(`${selectQuery} ORDER BY ?? DESC LIMIT 100`, [
          ...selectFields,
          "activity.createdAt",
        ]);
      }
      if (query?.rows) {
        query = query.rows;
      } else {
        query = [];
      }

      return JSON.parse(JSON.stringify(query));
    },
    errorFn: async (e) => {
      Logging.error({
        error: true,
        decorator: "GET_EXPLORE",
      });

      return [];
    },
  });
};
