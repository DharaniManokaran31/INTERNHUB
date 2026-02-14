import React from "react";

function CTA() {
  return (
    <section
      style={{
        padding: "60px 20px",
        textAlign: "center",
        background: "#0a66c2",
        color: "white"
      }}
    >
      <h2>Ready to start your internship journey?</h2>
      <button
        style={{
          marginTop: "20px",
          padding: "12px 25px",
          background: "white",
          color: "#0a66c2",
          border: "none",
          fontSize: "16px",
          cursor: "pointer",
          borderRadius: "5px"
        }}
      >
        Sign Up Now
      </button>
    </section>
  );
}

export default CTA;
