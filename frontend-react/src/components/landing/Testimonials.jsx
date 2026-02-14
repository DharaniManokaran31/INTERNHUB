import React from "react";

function Testimonials() {
  return (
    <section style={{ padding: "60px 20px", background: "#f9f9f9", textAlign: "center" }}>
      <h2>What Students Say</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginTop: "30px", flexWrap: "wrap" }}>
        <div style={{ maxWidth: "300px" }}>
          <p>"I got my first internship through InternHub!"</p>
          <strong>- Arjun, CSE Student</strong>
        </div>

        <div style={{ maxWidth: "300px" }}>
          <p>"Very easy to use and real companies."</p>
          <strong>- Priya, IT Student</strong>
        </div>

        <div style={{ maxWidth: "300px" }}>
          <p>"Saved me a lot of time searching internships."</p>
          <strong>- Karthik, ECE Student</strong>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
