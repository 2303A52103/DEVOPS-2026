import React from "react";
import StudentCard from "./StudentCard";

function App() {
  const students = [
    { name: "Anirudh", rollNo: "2303A52103", marks: 91 },
    { name: "Shiva Harsha", rollNo: "2303A52375", marks: 92 },
    { name: "Deekshith Goud", rollNo: "2303A52104", marks: 89 },
    { name: "Nitesh Kumar", rollNo: "2303A52098", marks: 95 },
    { name: "Pintu", rollNo: "2303A52100", marks: 76 },
    { name: "Billa", rollNo: "2303A52106", marks: 84 },
  ];
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Student Marks Card</h1>

      {/*  Passing data as props via mapping */}
      {students.map((s, index) => (
        <StudentCard
          key={s.rollNo + index}
          name={s.name}
          rollNo={s.rollNo}
          marks={s.marks}
        />
      ))}
    </div>
  );
}

export default App;