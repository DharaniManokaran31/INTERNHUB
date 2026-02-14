import React from "react";

function HowItWorks() {
  return (
    <section style={{
      padding: "60px 20px",
      background: "#f9fafb",
      textAlign: "center"
    }}>
      <h2>How It Works</h2>

      <div style={{
        display: "flex",
        justifyContent: "space-around",
        marginTop: "40px"
      }}>
        <div>
          <h3>1. Create Profile</h3>
          <p>Sign up and build your student profile.</p>
        </div>

        <div>
          <h3>2. Apply</h3>
          <p>Browse and apply for internships easily.</p>
        </div>

        <div>
          <h3>3. Get Hired</h3>
          <p>Start your internship journey.</p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
