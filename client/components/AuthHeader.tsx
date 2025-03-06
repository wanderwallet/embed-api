import Image from "next/image";

export function AuthHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="Wander Logo" width={40} height={40} />
            <span className="text-xl font-bold text-gray-900">
              Wander Embedded
            </span>
          </div>
          <div>
            <a
              href="https://wander.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 font-bold hover:text-gray-700"
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
