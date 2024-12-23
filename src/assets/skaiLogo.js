import skaiLogo from "./skai.png";

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <img
        src={skaiLogo}
        alt="Loading..."
        className="h-12 w-auto animate-pulse"
      />
      <p className="mt-2 text-gray-600">Loading...</p>
    </div>
  );
};

export const ErrorState = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <img src={skaiLogo} alt="Error" className="h-12 w-auto opacity-50" />
      <p className="mt-2 text-red-600">{message}</p>
    </div>
  );
};

export const EmptyState = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <img src={skaiLogo} alt="No data" className="h-16 w-auto opacity-30" />
      <p className="mt-4 text-gray-500">{message}</p>
    </div>
  );
};

export { skaiLogo };
