import React from "react";

function Stats() {
  return (
    <section style={{
      display: "flex",
      justifyContent: "space-around",
      padding: "40px 20px",
      background: "#ffffff"
    }}>
      <div>
        <h2>500+</h2>
        <p>Internships</p>
      </div>
      <div>
        <h2>1,200+</h2>
        <p>Students</p>
      </div>
      <div>
        <h2>300+</h2>
        <p>Companies</p>
      </div>
    </section>
  );
}

export default Stats;
