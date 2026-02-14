import React from "react";

function Hero() {
  return (
    <section style={{
      padding: "80px 20px",
      textAlign: "center",
      background: "#f1f5f9"
    }}>
      <h1 style={{fontSize: "40px", marginBottom: "20px"}}>
        Find Your Dream Internship
      </h1>
      <p style={{fontSize: "18px", marginBottom: "30px"}}>
        Connect with companies and start your career journey today.
      </p>
      <button style={{
        padding: "12px 24px",
        fontSize: "16px",
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer"
      }}>
        Get Started
      </button>
    </section>
  );
}

export default Hero;
