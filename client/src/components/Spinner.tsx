export default function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
           style={{ borderTopColor: '#f06420', borderRightColor: '#f0902044' }} />
    </div>
  )
}
