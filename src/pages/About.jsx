import React from "react";

function About() {
  return (
    <div>
      {/* About Section Header */}
      <section className="py-5 bg-light">
        <div className="container text-center mb-5">
          <h2 className="display-4">About Our Platform</h2>
          <p className="lead">
            We empower e-commerce businesses with cutting-edge technology to optimize pricing strategies,
            enhance customer experience, and maximize profitability through data-driven decisions.
          </p>
        </div>

        {/* Features Grid */}
        <div className="container">
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {/* Card 1 */}
            <div className="col">
              <FeatureCard
                icon="🔍"
                title="Smart Search & Shopping"
                desc="Advanced filtering system with intuitive cart and wishlist functionality for a seamless shopping experience."
              />
            </div>

            {/* Card 2 */}
            <div className="col">
              <FeatureCard
                icon="💳"
                title="Secure Payments"
                desc="Multiple payment options including cards, UPI, and digital wallets with bank-grade security."
              />
            </div>

            {/* Card 3 */}
            <div className="col">
              <FeatureCard
                icon="🤖"
                title="AI-Powered Optimization"
                desc="Dynamic pricing adjustments based on real-time market trends and demand analysis."
              />
            </div>

            {/* Card 4 */}
            <div className="col">
              <FeatureCard
                icon="📈"
                title="Real-Time Forecasting"
                desc="Predictive analytics for future pricing trends with automated price updates."
              />
            </div>

            {/* Card 5 */}
            <div className="col">
              <FeatureCard
                icon="📊"
                title="Analytics Dashboard"
                desc="Comprehensive insights into revenue, profit margins, and sales performance metrics."
              />
            </div>

            {/* Card 6 */}
            <div className="col">
              <FeatureCard
                icon="🛍️"
                title="Smart Recommendations"
                desc="Personalized product suggestions based on user behavior and preferences."
              />
            </div>

            {/* Card 7 */}
            <div className="col">
              <FeatureCard
                icon="🔔"
                title="Smart Notifications"
                desc="Automated alerts for seasonal discounts, price changes, and special offers."
              />
            </div>

            {/* Card 8 */}
            <div className="col">
              <FeatureCard
                icon="📉"
                title="Competitor Tracking"
                desc="Real-time monitoring of competitor pricing to maintain market advantage."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body text-center">
        <div className="mb-3" style={{ fontSize: "2rem" }}>
          {icon}
        </div>
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{desc}</p>
      </div>
    </div>
  );
}

export default About;
