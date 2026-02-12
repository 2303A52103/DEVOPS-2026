import { NavLink } from "react-router-dom";

function NavBar() {
  return (
    <nav style={styles.nav}>
      <NavLink to="/" style={styles.link}>Home</NavLink>
      <NavLink to="/products" style={styles.link}>Products</NavLink>
      <NavLink to="/cart" style={styles.link}>Cart</NavLink>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    gap: "20px",
    padding: "15px",
    backgroundColor: "#1f2937",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
  },
};

export default NavBar;