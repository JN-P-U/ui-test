const usePathname = jest.fn().mockReturnValue("/");
const useRouter = jest.fn().mockReturnValue({ push: jest.fn() });
module.exports = { usePathname, useRouter };
