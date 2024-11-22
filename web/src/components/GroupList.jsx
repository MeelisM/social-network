import React from "react";

const GroupList = ({ groups }) => {
  if (!groups || groups.length === 0) {
    return <p>No groups found.</p>;
  }

  return (
    <div>
      <ul>
        {groups.map((group) => (
          <li key={group.id}>
            <h3>{group.title}</h3>
            <p>{group.description}</p>
            <small>Created by: {group.creator_id}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupList;
