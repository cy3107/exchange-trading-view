// OrderBook.tsx
export default function OrderBook() {
  return (
    <div className="panel">
      <h3>订单簿</h3>
      <div className="book">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="row">
            <span className="price sell">62,{820 + i * 10}.00</span>
            <span className="amount">1.28{i}</span>
          </div>
        ))}
        <div className="current">62,850.00</div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="row">
            <span className="price buy">62,8{10 - i * 10}.00</span>
            <span className="amount">2.3{i}</span>
          </div>
        ))}
      </div>
    </div>
  )
}