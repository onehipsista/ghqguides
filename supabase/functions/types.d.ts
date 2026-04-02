declare module "https://esm.sh/stripe@14.25.0?target=denonext" {
  const Stripe: any;
  export default Stripe;
}

declare module "https://esm.sh/@supabase/supabase-js@2.49.8" {
  export const createClient: any;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
