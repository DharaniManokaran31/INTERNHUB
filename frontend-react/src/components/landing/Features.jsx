import React from "react";

function Features() {
  return (
    <section
      style={{
        padding: "60px 20px",
        textAlign: "center",
        background: "#ffffff"
      }}
    >
      <h2>Key Features</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: "40px",
          flexWrap: "wrap",
          gap: "20px"
        }}
      >
        <div style={{ maxWidth: "250px" }}>
          <h3>Verified Companies</h3>
          <p>Only trusted and verified companies post internships.</p>
        </div>

        <div style={{ maxWidth: "250px" }}>
          <h3>Easy Applications</h3>
          <p>Apply to internships with a single click.</p>
        </div>

        <div style={{ maxWidth: "250px" }}>
          <h3>Real-Time Updates</h3>
          <p>Get instant updates on your application status.</p>
        </div>

        <div style={{ maxWidth: "250px" }}>
          <h3>Student-Friendly</h3>
          <p>Designed especially for college students.</p>
        </div>
      </div>
    </section>
  );
}

export default Features;
