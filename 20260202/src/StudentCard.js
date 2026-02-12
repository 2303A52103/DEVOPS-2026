import React from "react";

function StudentCard(props) {
  return (
    <div
      style={{
        border: "2px solid black",
        width: "300px",
        margin: "20px auto",
        padding: "20px"
      }}
    >
      <h2>Student Details</h2>
      <p><strong>Name:</strong> {props.name}</p>
      <p><strong>Roll Number:</strong> {props.rollNo}</p>
      <p><strong>Marks:</strong> {props.marks}</p>
    </div>
  );
}

export default StudentCard;