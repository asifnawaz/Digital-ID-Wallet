import * as React from "react";
import * as System from "~/components/system";
import * as Constants from "~/common/constants";

import SystemPage from "~/components/system/SystemPage";
import ViewSourceLink from "~/components/system/ViewSourceLink";
import CodeBlock from "~/components/system/CodeBlock";
import Group from "~/components/system/Group";

const tags = ["nature", "scenes", "water", "earth", "fire", "mauritania", "sahara"];

const suggestions = ["nature", "africa", "scenes", "water", "mountains", "mauritania", "sahara"];

export default class SystemTags extends React.Component {
  render() {
    return (
      <SystemPage title="SDS: Tags" description="..." url="https://slate.host/_/system/tags">
        <System.H1>
          Tags <ViewSourceLink file="system/tags.js" />
        </System.H1>
        <br />
        <br />
        <System.P1>The Tag component is used to categorize items.</System.P1>
        <br />
        <br />
        <br />
        <System.H2>Imports</System.H2>
        <hr />
        <br />
        <System.P1>Import React and the AvatarGroup Component.</System.P1>
        <br />
        <CodeBlock>
          {`import * as React from "react";
import { Tag } from "slate-react-system";`}
        </CodeBlock>
        <br />
        <br />
        <System.H2>Usage</System.H2>
        <hr />
        <br />
        <System.P1>Create an array of tags.</System.P1>
        <br />
        <CodeBlock>
          {`const tags = [
  "nature",
  "scenes",
  "water",
  "earth",
  "fire",
  "mauritania", 
  "sahara"
];`}
        </CodeBlock>
        <br />
        <br />
        <System.P1>
          Declare the Tag component and add the array of tags as a prop to the component.
        </System.P1>
        <br />
        <CodeBlock>{`<Tag placeholder="Add your tags" tags={tags} />`}</CodeBlock>
        <br />
        <br />
        <System.H2>Output</System.H2>
        <hr />
        <br />
        <System.Tag placeholder="Add your tags" tags={tags} />
        <br />
        <br />
        <br />
        <System.P1>
          The Tag component also has a suggestions prop which accepts an array of strings.
        </System.P1>
        <br />
        <CodeBlock>
          {`const tags = [
  "nature",
  "scenes",
  "water",
  "earth",
  "fire",
  "mauritania", 
  "sahara"
];

const suggestions = [
  "nature",
  "africa",
  "scenes",
  "water",
  "mountains",
  "mauritania", 
  "sahara"
]`}
        </CodeBlock>
        <br />
        <br />
        <System.P1>
          Declare the Tag component and add the array of tags and suggestions as a props to the
          component.
        </System.P1>
        <br />
        <CodeBlock>
          {`<Tag 
  tags={tags} 
  suggestions={suggestions} 
/>`}
        </CodeBlock>
        <br />
        <br />
        <System.H2>Output</System.H2>
        <hr />
        <br />
        <System.Tag tags={tags} suggestions={suggestions} />
        <br />
        <br />
        <br />
        <System.H2>Accepted React Properties</System.H2>
        <hr />
        <br />
        <Group title="AvatarGroup">
          <System.Table
            data={{
              columns: [
                { key: "a", name: "Name", width: "128px" },
                { key: "b", name: "Type", width: "88px", type: "OBJECT_TYPE" },
                { key: "c", name: "Default", width: "88px" },
                { key: "d", name: "Description", width: "100%" },
              ],
              rows: [
                {
                  id: 1,
                  a: "type",
                  b: "string",
                  c: "null",
                  d: 'If set to "dark", the dark theme of the component will used',
                },
                {
                  id: 2,
                  a: "placeholder",
                  b: "string",
                  c: "null",
                  d: "Placeholder text",
                },
                {
                  id: 3,
                  a: "tags",
                  b: "array",
                  c: "[]",
                  d: "An array of strings of added tags to display",
                },
                {
                  id: 5,
                  a: "suggestions",
                  b: "array",
                  c: "[]",
                  d: "An array of strings to provide suggestions to the user",
                },
                {
                  id: 6,
                  a: "onChange",
                  b: "function",
                  c: "null",
                  d: "Function called on the onChange event",
                },
                {
                  id: 7,
                  a: "handleClick",
                  b: "function",
                  c: "null",
                  d: "Function called on the tag onClick event",
                },
                {
                  id: 8,
                  a: "style",
                  b: "object",
                  c: "null",
                  d: "An object of styles for the tag component container",
                },
                {
                  id: 9,
                  a: "inputStyles",
                  b: "object",
                  c: "null",
                  d: "An object of styles for the input element",
                },
                {
                  id: 10,
                  a: "dropdownStyles",
                  b: "object",
                  c: "null",
                  d: "An object of styles for the suggestions dropdown component container",
                },
              ],
            }}
          />
        </Group>
      </SystemPage>
    );
  }
}
