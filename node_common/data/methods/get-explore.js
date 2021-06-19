import { runQuery } from "~/node_common/data/utilities";

export default async ({ earliestTimestamp, latestTimestamp }) => {
  const slateFilesFields = ["files", "slate_files.createdAt", "files.id", "objects"];
  const slateFilesQuery = `coalesce(json_agg(?? order by ?? asc) filter (where ?? is not null), '[]') as ??`;

  const slateFields = [
    "slate_table",
    "slates.id",
    "slates.slatename",
    "slates.data",
    "slates.ownerId",
    "slates.isPublic",
    "slates.subscriberCount",
    "slates.fileCount",
    ...slateFilesFields,
    "slates",
    "slate_files",
    "slate_files.slateId",
    "slates.id",
    "files",
    "files.id",
    "slate_files.fileId",
    "slates.id",
  ];
  const slateQuery = `WITH ?? as (SELECT ??, ??, ??, ??, ??, ??, ??, ${slateFilesQuery} FROM ?? LEFT JOIN ?? on ?? = ?? LEFT JOIN ?? on ?? = ?? GROUP BY ??)`;

  const selectFields = [
    ...slateFields,
    "activity.id",
    "activity.type",
    "activity.createdAt",
    "slate_table",
    "slate",
    "files",
    "file",
    "users",
    "user",
    "owners",
    "owner",
    "activity",
    "slate_table",
    "slate_table.id",
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
  const selectQuery = `${slateQuery} SELECT ??, ??, ??, row_to_json(??) as ??, row_to_json(??) as ??, row_to_json(??) as ??, row_to_json(??) as ?? FROM ?? LEFT JOIN ?? ON ?? = ?? LEFT JOIN ?? ON ?? = ?? LEFT JOIN ?? ON ?? = ?? LEFT JOIN ?? AS ?? ON ?? = ??`;

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
      console.log({
        error: true,
        decorator: "GET_EXPLORE",
      });

      return [];
    },
  });
};
