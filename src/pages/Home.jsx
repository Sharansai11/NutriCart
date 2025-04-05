import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Star, ChevronRight } from "lucide-react";

// ProductCard Component
const ProductCard = ({ image, title, price, rating }) => {
  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    overflow: "hidden",
    transition: "transform 0.3s",
    cursor: "pointer",
  };

  const imageStyle = {
    width: "100%",
    height: "256px",
    objectFit: "cover",
    display: "block",
  };

  const heartButtonStyle = {
    position: "absolute",
    top: "16px",
    right: "16px",
    backgroundColor: "white",
    border: "none",
    borderRadius: "50%",
    padding: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    cursor: "pointer",
  };

  const buttonStyle = {
    backgroundColor: "#4F46E5", // Indigo
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "16px",
    cursor: "pointer",
    width: "100%",
  };

  return (
    <div style={cardStyle}>
      <div style={{ position: "relative" }}>
        <img src={image} alt={title} style={imageStyle} />
        <button style={heartButtonStyle}>
          <Heart size={20} color="#4B5563" />
        </button>
      </div>
      <div style={{ padding: "16px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
          {title}
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: "20px", fontWeight: "700", color: "#4F46E5" }}>
            ${price.toFixed(2)}
          </p>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Star size={20} color="#FBBF24" />
            <span style={{ marginLeft: "4px", color: "#4B5563" }}>
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
        <button style={buttonStyle}>
          <ShoppingCart size={20} style={{ marginRight: "8px" }} />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

// CategoryCard Component
const CategoryCard = ({ image, title }) => {
  const containerStyle = { position: "relative", cursor: "pointer" };
  const imageStyle = {
    width: "100%",
    height: "100px", // Reduced height from 192px to 150px
    objectFit: "cover",
    borderRadius: "8px",
    display: "block",
  };
  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: "8px",
  };
  const textStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontSize: "20px",
    fontWeight: "bold",
  };

  return (
    <div style={containerStyle}>
      <img src={image} alt={title} style={imageStyle} />
      <div style={overlayStyle}></div>
      <div style={textStyle}>{title}</div>
    </div>
  );
};

// Main HomePage Component
const HomePage = () => {
  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 16px",
  };

  const heroStyle = {
    position: "relative",
    height: "600px",
    backgroundImage:
      'url("https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80")',
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const heroOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(to right, rgba(0,0,0,0.7), transparent)",
  };

  const heroContentStyle = {
    position: "relative",
    color: "white",
    height: "100%",
    display: "flex",
    alignItems: "center",
  };

  const sectionTitleStyle = {
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "16px",
  };

  const linkStyle = {
    color: "#4F46E5",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    fontSize: "16px",
  };

  const gridStyle = (minWidth) => ({
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
    gap: "24px",
  });

  const featuredProducts = [
    {
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      title: "Premium Smart Watch",
      price: 199.99,
      rating: 4.8,
    },
    {
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      title: "Wireless Headphones",
      price: 149.99,
      rating: 4.9,
    },
    {
      image:
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      title: "Camera Lens",
      price: 299.99,
      rating: 4.7,
    },
    {
      image:
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      title: "Smart Speaker",
      price: 79.99,
      rating: 4.5,
    },
  ];

  const categories = [
    {
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      title: "Fashion",
    },
    {
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      title: "Electronics",
    },
    {
      image:
        "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      title: "Home & Living",
    },
    {
      image:
        "https://images.unsplash.com/photo-1470309864661-68328b2cd0a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      title: "Beauty",
    },
  ];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#333" }}>
      {/* Hero Section */}
      <div style={heroStyle}>
        <div style={heroOverlayStyle}>
          <div style={{ ...containerStyle, ...heroContentStyle }}>
            <div>
              <h1 style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "24px" }}>
                Discover Amazing Deals
              </h1>
              <p style={{ fontSize: "20px", marginBottom: "32px" }}>
                Shop the latest trends with unbeatable prices. Limited time offers available now!
              </p>
              <Link
                to="/products"
                style={{
                  backgroundColor: "#4F46E5",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div style={{ padding: "64px 0" }}>
        <div style={{ ...containerStyle, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 style={sectionTitleStyle}>Shop by Category</h2>
          <Link to="/categories" style={linkStyle}>
            View All <ChevronRight size={20} style={{ marginLeft: "4px" }} />
          </Link>
        </div>
        <div style={{ ...containerStyle, ...gridStyle(200) }}>
          {categories.map((category, index) => (
            <CategoryCard key={index} {...category} />
          ))}
        </div>
      </div>

      {/* Featured Products Section */}
      <div style={{ padding: "64px 0", backgroundColor: "#f9f9f9" }}>
        <div style={{ ...containerStyle, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 style={sectionTitleStyle}>Featured Products</h2>
          <Link to="/products" style={linkStyle}>
            View All <ChevronRight size={20} style={{ marginLeft: "4px" }} />
          </Link>
        </div>
        <div style={{ ...containerStyle, ...gridStyle(250) }}>
          {featuredProducts.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </div>
      </div>

      {/* Promotion Banner */}
      <div style={{ backgroundColor: "#4F46E5", padding: "64px 0" }}>
        <div style={{ ...containerStyle, display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
          <div style={{ color: "white", textAlign: "center" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "16px" }}>
              Summer Sale Is Now Live!
            </h2>
            <p style={{ fontSize: "20px", opacity: 0.9 }}>
              Get up to 50% off on selected items. Limited time offer.
            </p>
          </div>
          <Link
            to="/sale"
            style={{
              backgroundColor: "white",
              color: "#4F46E5",
              padding: "12px 24px",
              borderRadius: "999px",
              textDecoration: "none",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Shop the Sale
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: "#333", color: "white", padding: "64px 0" }}>
        <div style={{ ...containerStyle, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px" }}>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>Shop</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li style={{ marginBottom: "8px" }}>
                <Link to="/new-arrivals" style={{ color: "white", textDecoration: "none" }}>
                  New Arrivals
                </Link>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <Link to="/best-sellers" style={{ color: "white", textDecoration: "none" }}>
                  Best Sellers
                </Link>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <Link to="/trending" style={{ color: "white", textDecoration: "none" }}>
                  Trending Now
                </Link>
              </li>
              <li>
                <Link to="/sale" style={{ color: "white", textDecoration: "none" }}>
                  Sale
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>Customer Service</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li style={{ marginBottom: "8px" }}>
                <Link to="/contact" style={{ color: "white", textDecoration: "none" }}>
                  Contact Us
                </Link>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <Link to="/shipping-info" style={{ color: "white", textDecoration: "none" }}>
                  Shipping Info
                </Link>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <Link to="/returns" style={{ color: "white", textDecoration: "none" }}>
                  Returns
                </Link>
              </li>
              <li>
                <Link to="/faq" style={{ color: "white", textDecoration: "none" }}>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>About</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li style={{ marginBottom: "8px" }}>
                <Link to="/our-story" style={{ color: "white", textDecoration: "none" }}>
                  Our Story
                </Link>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <Link to="/careers" style={{ color: "white", textDecoration: "none" }}>
                  Careers
                </Link>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <Link to="/press" style={{ color: "white", textDecoration: "none" }}>
                  Press
                </Link>
              </li>
              <li>
                <Link to="/blog" style={{ color: "white", textDecoration: "none" }}>
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px" }}>Follow Us</h3>
            <p style={{ marginBottom: "16px" }}>
              Subscribe to our newsletter for exclusive offers and updates.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "999px",
                  border: "none",
                  outline: "none",
                }}
              />
              <button
                style={{
                  backgroundColor: "#4F46E5",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #555", marginTop: "32px", paddingTop: "32px", textAlign: "center" }}>
          <p>&copy; 2025 Your E-Commerce Store. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
