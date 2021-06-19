import { runQuery } from "~/node_common/data/utilities";

export default async ({
  following = [],
  subscriptions = [],
  earliestTimestamp,
  latestTimestamp,
}) => {
  let usersFollowing = following || [];
  if (!following?.length || following.length < 3) {
    usersFollowing.push([
      "f292c19f-1337-426c-8002-65e128b95096",
      "708559e6-cfc9-4b82-8241-3f4e5046028d",
      "1195e8bb-3f94-4b47-9deb-b30d6a6f82c4",
      "231d5d53-f341-448b-9e92-0b7847c5b667",
      "a280fce9-d85f-455a-9523-88f2bacd7d63",
      "d909728d-f699-4474-a7d4-584b62907c53",
      "20c15eab-ad33-40fd-a434-958a5f1ccb67",
      "3cad78ea-01ad-4c92-8983-a97524fb9e35",
    ]);
  }
  // const slateFiles = DB.raw(
  //   "coalesce(json_agg(?? order by ?? asc) filter (where ?? is not null), '[]') as ??",
  //   ["files", "slate_files.createdAt", "files.id", "objects"]
  // );
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
  // const selectQuery =
  //   "SELECT ??, ??, ??, row_to_json(??) as ??, row_to_json(??) as ??, row_to_json(??) as ??, row_to_json(??) as ?? FROM ?? LEFT JOIN ?? ON ?? = ?? LEFT JOIN ?? ON ?? = ?? LEFT JOIN ?? ON ?? = ?? LEFT JOIN ?? AS ?? ON ?? = ??";

  const conditionFields = ["activity.ownerId", usersFollowing, "activity.slateId", subscriptions];

  return await runQuery({
    label: "GET_ACTIVITY_FOR_USER_ID",
    queryFn: async (DB) => {
      let query;
      if (earliestTimestamp) {
        //NOTE(martina): for pagination, fetching the "next 100" results
        let date = new Date(earliestTimestamp);
        date.setSeconds(date.getSeconds() - 1);
        query = await DB.raw(
          `${selectQuery} WHERE (?? = ANY(?) OR ?? = ANY(?)) AND ?? < ?? ORDER BY ?? DESC LIMIT 100`,
          [
            ...selectFields,
            ...conditionFields,
            "activity.createdAt",
            date.toISOString(),
            "activity.createdAt",
          ]
        );
      } else if (latestTimestamp) {
        //NOTE(martina): for fetching new updates since the last time they loaded
        let date = new Date(latestTimestamp);
        date.setSeconds(date.getSeconds() + 1);
        query = await DB.raw(
          `${selectQuery} WHERE (?? = ANY(?) OR ?? = ANY(?)) AND ?? > ?? ORDER BY ?? DESC LIMIT 100`,
          [
            ...selectFields,
            ...conditionFields,
            "activity.createdAt",
            date.toISOString(),
            "activity.createdAt",
          ]
        );
      } else {
        //NOTE(martina): for the first fetch they make, when they have not loaded any explore events yet
        query = await DB.raw(
          `${selectQuery} WHERE ?? = ANY(?) OR ?? = ANY(?) ORDER BY ?? DESC LIMIT 100`,
          [...selectFields, ...conditionFields, "activity.createdAt"]
        );
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
        decorator: "GET_ACTIVITY_FOR_USER_ID",
      });

      return [];
    },
  });
};
