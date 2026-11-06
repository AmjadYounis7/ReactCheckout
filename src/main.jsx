import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Check, ChevronDown, CreditCard, LockKeyhole, PackageCheck, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import "./styles.css";

const products = [
  { name: "Everyday tote", detail: "Natural canvas", price: 24, quantity: 1, icon: "◒" },
  { name: "Ceramic mug", detail: "Warm ivory · Set of 2", price: 18, quantity: 2, icon: "◡" },
  { name: "Softcover notebook", detail: "Sage green", price: 12, quantity: 1, icon: "▱" },
];

const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const initialForm = { fullName: "", email: "", phone: "", city: "", address: "", delivery: "standard", payment: "cash", cardNumber: "", expiry: "", cvc: "" };

function Field({ label, className = "", hint, ...props }) {
  return <label className={className}><span>{label}</span><input {...props} />{hint && <small>{hint}</small>}</label>;
}

function Choice({ name, value, checked, onChange, title, text, price, icon }) {
  return <label className={`choice ${checked ? "selected" : ""}`}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
    <span className="choice-icon" aria-hidden="true">{icon}</span>
    <span className="choice-copy"><strong>{title}</strong><small>{text}</small></span>
    {price && <b>{price}</b>}
    <span className="radio-dot" aria-hidden="true" />
  </label>;
}

function Section({ number, title, subtitle, children }) {
  return <section className="panel form-panel">
    <div className="section-title"><span className="step">{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>
    {children}
  </section>;
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [promo, setPromo] = useState("");
  const [promoState, setPromoState] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem("checkoutOrders") || "[]"); } catch { return []; }
  });
  const confirmationRef = useRef(null);
  const subtotal = useMemo(() => products.reduce((sum, p) => sum + p.price * p.quantity, 0), []);
  const itemCount = products.reduce((sum, p) => sum + p.quantity, 0);
  const discount = promoState === "valid" ? Math.round(subtotal * 10) / 100 : 0;
  const deliveryFee = form.delivery === "express" ? 10 : 5;
  const total = subtotal - discount + deliveryFee;
  const detailsComplete = Boolean(form.fullName && form.email && form.phone && form.city && form.address);
  const progress = detailsComplete ? 100 : [form.fullName, form.email, form.phone, form.city, form.address].filter(Boolean).length * 12 + 25;

  useEffect(() => { if (confirmation) confirmationRef.current?.focus(); }, [confirmation]);

  const update = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));
  const applyPromo = () => setPromoState(promo.trim().toUpperCase() === "SAVE10" ? "valid" : "invalid");
  const expiryValid = (value) => {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return false;
    const [month, year] = value.split("/").map(Number);
    return new Date(2000 + year, month, 1) > new Date();
  };

  const submit = (event) => {
    event.preventDefault();
    if (form.payment === "card" && !expiryValid(form.expiry)) {
      event.currentTarget.elements.expiry.setCustomValidity("Enter a valid expiry date that has not passed.");
      event.currentTarget.reportValidity();
      return;
    }
    const order = {
      number: `ORD-${Date.now()}`, total, delivery: form.delivery === "express" ? "Express delivery" : "Standard delivery",
      payment: form.payment === "card" ? "Card — simulation only" : "Cash on delivery", placedAt: new Date().toISOString(), items: products,
    };
    const nextOrders = [...orders, order];
    setOrders(nextOrders);
    try { localStorage.setItem("checkoutOrders", JSON.stringify(nextOrders)); } catch {}
    setConfirmation({ ...order, customer: form.fullName.trim(), address: form.address.trim(), email: form.email.trim() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restart = () => {
    setForm(initialForm); setPromo(""); setPromoState(null); setConfirmation(null);
    requestAnimationFrame(() => document.querySelector('[name="fullName"]')?.focus());
  };

  if (confirmation) return <>
    <Header />
    <main className="shell confirmation-shell">
      <section className="confirmation panel" ref={confirmationRef} tabIndex="-1">
        <div className="success"><Check size={30} strokeWidth={2.5} /></div>
        <p className="eyebrow">ORDER CONFIRMED</p>
        <h1>You’re all set.</h1>
        <p className="lead">Thanks, {confirmation.customer}. Your demo order is confirmed and ready to go.</p>
        <div className="receipt">
          <div className="receipt-top"><div><small>ORDER NUMBER</small><strong>{confirmation.number}</strong></div><div><small>TOTAL</small><strong>{money(confirmation.total)}</strong></div></div>
          <div className="receipt-grid"><p><span>Deliver to</span>{confirmation.address}</p><p><span>Delivery</span>{confirmation.delivery}</p><p><span>Payment</span>{confirmation.payment}</p><p><span>Receipt sent to</span>{confirmation.email}</p></div>
          <div className="receipt-items">{products.map((p) => <div key={p.name}><span>{p.name} × {p.quantity}</span><b>{money(p.price * p.quantity)}</b></div>)}</div>
        </div>
        <div className="confirmation-actions"><button className="primary" onClick={() => window.print()}>Print receipt</button><button className="secondary" onClick={restart}><RotateCcw size={16} /> Start again</button></div>
      </section>
      <OrderHistory orders={orders} />
    </main>
  </>;

  return <div className="app-frame">
    <div className="ambient ambient-one" aria-hidden="true" />
    <div className="ambient ambient-two" aria-hidden="true" />
    <div className="noise" aria-hidden="true" />
    <Header />
    <main className="shell">
      <section className="intro"><div><p className="eyebrow"><Sparkles size={12} /> SECURE CHECKOUT</p><h1>Almost <em>yours.</em></h1><p>Just a few details between you and the good stuff.</p></div><div className="trust"><span className="pulse" /><ShieldCheck size={18} /><span>Protected demo checkout</span></div></section>
      <div className="progress-card" aria-label={`${progress}% checkout progress`}><div className="progress-copy"><span>Checkout progress</span><b>{detailsComplete ? "Ready to order" : "Add your details"}</b></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div>
      <div className="checkout-grid">
        <form id="checkout-form" onSubmit={submit}>
          <div className="reveal reveal-one"><Section number={detailsComplete ? <Check size={15} /> : "01"} title="Your details" subtitle="Where should your order go?">
            <div className="fields">
              <Field label="Full name" name="fullName" value={form.fullName} onChange={update} autoComplete="name" required minLength="2" maxLength="80" placeholder="Alex Smith" />
              <Field label="Email address" name="email" type="email" value={form.email} onChange={update} autoComplete="email" required maxLength="120" placeholder="alex@example.com" />
              <Field label="Phone number" name="phone" type="tel" value={form.phone} onChange={update} pattern="\+?(?:[0-9][ \-]*){6,14}[0-9]" title="Enter 7 to 15 digits. Spaces, hyphens, and an initial plus sign are allowed." autoComplete="tel" required maxLength="25" placeholder="+961 70 123 456" hint="Include your country code if needed." />
              <Field label="City" name="city" value={form.city} onChange={update} autoComplete="address-level2" required minLength="2" maxLength="80" placeholder="Beirut" />
              <Field className="full" label="Delivery address" name="address" value={form.address} onChange={update} autoComplete="street-address" required minLength="5" maxLength="200" placeholder="Street, building, floor, apartment" />
            </div>
          </Section></div>
          <div className="reveal reveal-two"><Section number="02" title="Delivery method" subtitle="Choose the pace that suits you.">
            <div className="choices"><Choice name="delivery" value="standard" checked={form.delivery === "standard"} onChange={update} icon={<Truck size={19} />} title="Standard delivery" text="3–5 business days" price="$5" /><Choice name="delivery" value="express" checked={form.delivery === "express"} onChange={update} icon={<PackageCheck size={19} />} title="Express delivery" text="1–2 business days" price="$10" /></div>
          </Section></div>
          <div className="reveal reveal-three"><Section number="03" title="Payment" subtitle="Select how you’d like to pay.">
            <div className="choices"><Choice name="payment" value="cash" checked={form.payment === "cash"} onChange={update} icon={<PackageCheck size={19} />} title="Cash on delivery" text="Pay when your order arrives" /><Choice name="payment" value="card" checked={form.payment === "card"} onChange={update} icon={<CreditCard size={19} />} title="Credit / debit card" text="Demo payment only" /></div>
            {form.payment === "card" && <div className="card-fields"><p className="demo-note"><LockKeyhole size={16} /><span>Simulation only. Use <b>4242 4242 4242 4242</b>, a future expiry, and any 3-digit CVC.</span></p><div className="fields"><Field className="full" label="Demo card number" name="cardNumber" value={form.cardNumber} onChange={update} pattern="4242 ?4242 ?4242 ?4242" title="Use the demo card number 4242 4242 4242 4242." inputMode="numeric" required maxLength="19" placeholder="4242 4242 4242 4242" autoComplete="off" /><Field label="Expiry date" name="expiry" value={form.expiry} onChange={(e) => { e.target.setCustomValidity(""); update(e); }} pattern="(0[1-9]|1[0-2])/[0-9]{2}" required maxLength="5" placeholder="MM/YY" inputMode="numeric" autoComplete="off" /><Field label="CVC" name="cvc" type="password" value={form.cvc} onChange={update} pattern="[0-9]{3}" required maxLength="3" placeholder="123" inputMode="numeric" autoComplete="off" /></div></div>}
          </Section></div>
        </form>
        <aside className="panel summary reveal reveal-four">
          <div className="summary-title"><div><p className="eyebrow">YOUR ORDER</p><h2>Order summary</h2></div><span>{itemCount} items</span></div>
          <div className="products">{products.map((product, index) => <div className="product" key={product.name}><div className={`product-art art-${index}`}>{product.icon}<i>{product.quantity}</i></div><div><strong>{product.name}</strong><small>{product.detail}</small></div><b>{money(product.price * product.quantity)}</b></div>)}</div>
          <div className="promo"><label htmlFor="promo">Promo code</label><div><input id="promo" value={promo} onChange={(e) => { setPromo(e.target.value); setPromoState(null); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }} placeholder="Try SAVE10" maxLength="30" /><button type="button" onClick={applyPromo}>Apply</button></div>{promoState && <p className={promoState}>{promoState === "valid" ? "Nice! 10% discount applied." : "That code isn’t valid."}</p>}</div>
          <dl className="totals"><div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>{discount > 0 && <div className="discount"><dt>Discount (10%)</dt><dd>−{money(discount)}</dd></div>}<div><dt>Delivery</dt><dd>{money(deliveryFee)}</dd></div><div className="grand-total"><dt>Total <small>USD</small></dt><dd>{money(total)}</dd></div></dl>
          <button className="primary place-order" type="submit" form="checkout-form"><span>Place order</span><i><ArrowRight size={18} /></i></button>
          <p className="secure-note"><LockKeyhole size={13} /> Practice checkout. No payment will be taken.</p>
        </aside>
      </div>
      <OrderHistory orders={orders} />
      <footer><span>A little everyday, a little better.</span><b>nova goods.</b></footer>
    </main>
  </div>;
}

function Header() { return <header className="topbar"><a href="/" className="brand">nova<span>goods.</span></a><div><LockKeyhole size={13} /><span>Secure checkout</span><i /> <span>USD</span></div></header>; }

function OrderHistory({ orders }) { return <section className="history panel"><div className="history-title"><div><p className="eyebrow">SAVED LOCALLY</p><h2>Order history</h2></div><span>{orders.length} {orders.length === 1 ? "order" : "orders"}</span></div>{orders.length === 0 ? <p className="empty">No orders yet. Your completed demo orders will appear here.</p> : <div className="history-list">{[...orders].reverse().map((order) => <details key={order.number}><summary><span><b>{order.number}</b><small>{order.placedAt ? new Date(order.placedAt).toLocaleString() : "Saved order"}</small></span><strong>{money(order.total)}</strong><ChevronDown size={17} /></summary><div className="history-details"><p>{order.delivery} · {order.payment}</p>{order.items?.map((p) => <div key={p.name}><span>{p.name} × {p.quantity}</span><b>{money(p.price * p.quantity)}</b></div>)}</div></details>)}</div>}</section>; }

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
