import * as _prisma_client from '@prisma/client';
import { Wallet, WalletSourceType, WalletSourceFrom, Challenge, AnonChallenge, Session } from '@prisma/client';
export { AuthProviderType, Chain, Challenge as DbChallenge, Session as DbSession, UserProfile as DbUserProfile, ExportType, WalletPrivacySetting, WalletSourceFrom, WalletSourceType, WalletStatus } from '@prisma/client';
import * as _supabase_supabase_js from '@supabase/supabase-js';
import { SupabaseClientOptions } from '@supabase/supabase-js';
export { User as SupabaseUser } from '@supabase/supabase-js';
import * as _trpc_client from '@trpc/client';
import * as _trpc_server from '@trpc/server';
import * as _prisma_client_runtime_library from '@prisma/client/runtime/library';
import * as superjson from 'superjson';
import superjson__default from 'superjson';
import { JWKInterface } from 'arweave/node/lib/wallet';

interface WalletSource {
    type?: WalletSourceType;
    from?: WalletSourceFrom;
}
interface WalletInfo {
    ens: string;
    ensResolution: any;
    ans: string;
    ansResolution: any;
    pns: string;
    pnsResolution: any;
}
interface DbWallet extends Omit<Wallet, "info" | "source"> {
    info: null | WalletInfo;
    source: null | WalletSource;
}
interface RecoverableAccount {
    userId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    picture: string | null;
}

declare const appRouter: _trpc_server.CreateRouterInner<_trpc_server.RootConfig<{
    ctx: {
        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        user: null;
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            deviceNonce: string;
            ip: string;
            userAgent: string;
        } & {
            applicationId: string;
        };
    } | {
        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        user: _supabase_supabase_js.AuthUser;
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            deviceNonce: string;
            ip: string;
            userAgent: string;
        } & {
            applicationId: string;
        };
    };
    meta: object;
    errorShape: _trpc_server.DefaultErrorShape;
    transformer: typeof superjson.default;
}>, {
    fetchWallets: _trpc_server.BuildProcedure<"query", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: typeof _trpc_server.unsetMarker;
        _input_out: typeof _trpc_server.unsetMarker;
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallets: DbWallet[];
    }>;
    doNotAskAgainForBackup: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
        };
        _input_out: {
            walletId: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
    }>;
    createPublicWallet: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            status: "ENABLED" | "DISABLED";
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            publicKey: string;
            walletPrivacySetting: "PUBLIC";
            canRecoverAccountSetting: boolean;
            source: {
                type: "IMPORTED" | "GENERATED";
                from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
            };
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        _input_out: {
            status: "ENABLED" | "DISABLED";
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            publicKey: string;
            walletPrivacySetting: "PUBLIC";
            canRecoverAccountSetting: boolean;
            source: {
                type: "IMPORTED" | "GENERATED";
                from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
            };
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
    }>;
    createPrivateWallet: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            status: "ENABLED" | "DISABLED";
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            walletPrivacySetting: "PRIVATE";
            source: {
                type: "IMPORTED" | "GENERATED";
                from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
            };
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        _input_out: {
            status: "ENABLED" | "DISABLED";
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            walletPrivacySetting: "PRIVATE";
            source: {
                type: "IMPORTED" | "GENERATED";
                from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
            };
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
    }>;
    createReadOnlyWallet: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            status: "READONLY" | "LOST";
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            publicKey?: string | undefined;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        _input_out: {
            status: "READONLY" | "LOST";
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            publicKey?: string | undefined;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
    }>;
    makeWalletPrivate: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletPrivacySetting: "PRIVATE";
            walletId: string;
        };
        _input_out: {
            walletPrivacySetting: "PRIVATE";
            walletId: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
    }>;
    makeWalletPublic: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            publicKey: string;
            walletPrivacySetting: "PUBLIC";
            walletId: string;
        };
        _input_out: {
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            publicKey: string;
            walletPrivacySetting: "PUBLIC";
            walletId: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
    }>;
    updateWalletInfo: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
            identifierTypeSetting?: "ALIAS" | "ANS" | "PNS" | undefined;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        _input_out: {
            walletId: string;
            identifierTypeSetting?: "ALIAS" | "ANS" | "PNS" | undefined;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
    }>;
    updateWalletRecovery: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            canRecoverAccountSetting: boolean;
            walletId: string;
        };
        _input_out: {
            canRecoverAccountSetting: boolean;
            walletId: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
    }>;
    updateWalletStatus: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            status: "ENABLED" | "DISABLED" | "READONLY" | "LOST";
            walletId: string;
        };
        _input_out: {
            status: "ENABLED" | "DISABLED" | "READONLY" | "LOST";
            walletId: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
    }>;
    deleteWallet: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
        };
        _input_out: {
            walletId: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {}>;
    generateWalletActivationChallenge: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
        };
        _input_out: {
            walletId: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        activationChallenge: {
            id: string;
            createdAt: Date;
            userId: string;
            value: string;
            walletId: string;
            type: _prisma_client.$Enums.ChallengeType;
            purpose: _prisma_client.$Enums.ChallengePurpose;
            version: string;
        };
    }>;
    activateWallet: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
            challengeSolution: string;
        };
        _input_out: {
            walletId: string;
            challengeSolution: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
        authShare: string;
        rotationChallenge: {
            id: string;
            createdAt: Date;
            userId: string;
            value: string;
            walletId: string;
            type: _prisma_client.$Enums.ChallengeType;
            purpose: _prisma_client.$Enums.ChallengePurpose;
            version: string;
        } | null;
    }>;
    rotateAuthShare: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            challengeSolution: string;
        };
        _input_out: {
            walletId: string;
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            challengeSolution: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        nextRotationAt: Date;
    }>;
    registerRecoveryShare: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
            recoveryAuthShare: string;
            recoveryBackupShareHash: string;
            recoveryBackupSharePublicKey: string;
        };
        _input_out: {
            walletId: string;
            recoveryAuthShare: string;
            recoveryBackupShareHash: string;
            recoveryBackupSharePublicKey: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
        recoveryFileServerSignature: string;
    }>;
    registerWalletExport: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
            type: "SEEDPHRASE" | "KEYFILE";
        };
        _input_out: {
            walletId: string;
            type: "SEEDPHRASE" | "KEYFILE";
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
    }>;
    generateWalletRecoveryChallenge: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
        };
        _input_out: {
            walletId: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        shareRecoveryChallenge: {
            id: string;
            createdAt: Date;
            userId: string;
            value: string;
            walletId: string;
            type: _prisma_client.$Enums.ChallengeType;
            purpose: _prisma_client.$Enums.ChallengePurpose;
            version: string;
        };
    }>;
    recoverWallet: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
            challengeSolution: string;
            recoveryBackupShareHash?: string | undefined;
            recoveryFileServerSignature?: string | undefined;
        };
        _input_out: {
            walletId: string;
            challengeSolution: string;
            recoveryBackupShareHash?: string | undefined;
            recoveryFileServerSignature?: string | undefined;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        recoveryAuthShare: null;
        recoveryBackupServerPublicKey: string;
        wallet?: undefined;
        rotationChallenge?: undefined;
    } | {
        wallet: DbWallet;
        recoveryAuthShare: string | undefined;
        rotationChallenge: {
            id: string;
            createdAt: Date;
            userId: string;
            value: string;
            walletId: string;
            type: _prisma_client.$Enums.ChallengeType;
            purpose: _prisma_client.$Enums.ChallengePurpose;
            version: string;
        };
        recoveryBackupServerPublicKey?: undefined;
    }>;
    registerAuthShare: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: {
            walletId: string;
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            challengeSolution: string;
        };
        _input_out: {
            walletId: string;
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            challengeSolution: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        wallet: DbWallet;
        nextRotationAt: Date;
    }>;
    generateFetchRecoverableAccountsChallenge: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: null;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        } | {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: _supabase_supabase_js.AuthUser;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        };
        _input_in: {
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
        };
        _input_out: {
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        fetchRecoverableWalletsChallenge: {
            id: string;
            createdAt: Date;
            chain: _prisma_client.$Enums.Chain;
            address: string;
            value: string;
            version: string;
        };
    }>;
    fetchRecoverableAccounts: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: null;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        } | {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: _supabase_supabase_js.AuthUser;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        };
        _input_in: {
            challengeId: string;
            challengeSolution: string;
        };
        _input_out: {
            challengeId: string;
            challengeSolution: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        recoverableAccounts: RecoverableAccount[];
    }>;
    generateAccountRecoveryChallenge: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: null;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        } | {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: _supabase_supabase_js.AuthUser;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        };
        _input_in: {
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            userId: string;
        };
        _input_out: {
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            userId: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        accountRecoveryChallenge: {
            id: string;
            createdAt: Date;
            userId: string;
            value: string;
            walletId: string;
            type: _prisma_client.$Enums.ChallengeType;
            purpose: _prisma_client.$Enums.ChallengePurpose;
            version: string;
        };
    }>;
    recoverAccount: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: null;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        } | {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: _supabase_supabase_js.AuthUser;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        };
        _input_in: {
            userId: string;
            challengeSolution: string;
        };
        _input_out: {
            userId: string;
            challengeSolution: string;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        userDetails: [{
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            supId: string;
            supEmail: string | null;
            supPhone: string | null;
            email: string | null;
            phone: string | null;
            picture: string | null;
            recoveredAt: Date | null;
            userDetailsRecoveryPrivacy: _prisma_client.$Enums.UserDetailsPrivacySetting[];
            notificationsSetting: _prisma_client.$Enums.NotificationSetting;
            recoveryWalletsRequiredSetting: number;
            ipPrivacyFilterSetting: _prisma_client.$Enums.FilterPrivacySetting | null;
            countryPrivacySetting: _prisma_client.$Enums.FilterPrivacySetting | null;
        }, {
            id: string;
            createdAt: Date;
            userId: string;
            value: string;
            walletId: string;
            type: _prisma_client.$Enums.ChallengeType;
            purpose: _prisma_client.$Enums.ChallengePurpose;
            version: string;
        }];
    }>;
    validateApplication: _trpc_server.BuildProcedure<"query", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: null;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        } | {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: _supabase_supabase_js.AuthUser;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        };
        _input_in: {
            clientId: string;
            applicationOrigin: string;
            sessionId?: string | undefined;
        };
        _input_out: {
            clientId: string;
            applicationOrigin: string;
            sessionId?: string | undefined;
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, string>;
    debugSession: _trpc_server.BuildProcedure<"query", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: typeof _trpc_server.unsetMarker;
        _input_out: typeof _trpc_server.unsetMarker;
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        user: _supabase_supabase_js.AuthUser;
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            deviceNonce: string;
            ip: string;
            userAgent: string;
        } & {
            applicationId: string;
        };
    }>;
    authenticate: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: null;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        } | {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            user: _supabase_supabase_js.AuthUser;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
        };
        _input_in: {
            email: string;
            authProviderType: "EMAIL_N_PASSWORD";
            password: string;
        } | {
            authProviderType: "PASSKEYS" | "GOOGLE" | "FACEBOOK" | "X" | "APPLE";
        };
        _input_out: {
            email: string;
            authProviderType: "EMAIL_N_PASSWORD";
            password: string;
        } | {
            authProviderType: "PASSKEYS" | "GOOGLE" | "FACEBOOK" | "X" | "APPLE";
        };
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        user: _supabase_supabase_js.AuthUser;
        url: null;
        data?: undefined;
    } | {
        user: null;
        data: string;
        url?: undefined;
    }>;
    getUser: _trpc_server.BuildProcedure<"query", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: typeof _trpc_server.unsetMarker;
        _input_out: typeof _trpc_server.unsetMarker;
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        user: _supabase_supabase_js.AuthUser | null;
    }>;
    logout: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: typeof _trpc_server.unsetMarker;
        _input_out: typeof _trpc_server.unsetMarker;
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        success: boolean;
        message: string;
    }>;
    refreshSession: _trpc_server.BuildProcedure<"mutation", {
        _config: _trpc_server.RootConfig<{
            ctx: {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: null;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            } | {
                prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            };
            meta: object;
            errorShape: _trpc_server.DefaultErrorShape;
            transformer: typeof superjson.default;
        }>;
        _meta: object;
        _ctx_out: {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        } | {
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            } & {
                applicationId: string;
            };
            user: _supabase_supabase_js.AuthUser;
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        };
        _input_in: typeof _trpc_server.unsetMarker;
        _input_out: typeof _trpc_server.unsetMarker;
        _output_in: typeof _trpc_server.unsetMarker;
        _output_out: typeof _trpc_server.unsetMarker;
    }, {
        message: string;
        user: _supabase_supabase_js.AuthUser;
        session: {
            expires_at: number | undefined;
            expires_in: number;
        };
    }>;
}>;
type AppRouter = typeof appRouter;

interface CreateTRPCClientOptions {
    baseURL?: string;
    trpcURL?: string;
    authToken?: string | null;
    deviceNonce?: string;
    clientId?: string;
    applicationId?: string;
    onAuthError?: () => void;
}
declare function createTRPCClient({ baseURL, trpcURL, onAuthError, ...params }: CreateTRPCClientOptions): {
    client: {
        fetchWallets: {
            query: _trpc_client.Resolver<_trpc_server.BuildProcedure<"query", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: typeof _trpc_server.unsetMarker;
                _input_out: typeof _trpc_server.unsetMarker;
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallets: DbWallet[];
            }>>;
        };
        doNotAskAgainForBackup: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                };
                _input_out: {
                    walletId: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
            }>>;
        };
        createPublicWallet: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    status: "ENABLED" | "DISABLED";
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                    publicKey: string;
                    walletPrivacySetting: "PUBLIC";
                    canRecoverAccountSetting: boolean;
                    source: {
                        type: "IMPORTED" | "GENERATED";
                        from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
                    };
                    authShare: string;
                    deviceShareHash: string;
                    deviceSharePublicKey: string;
                    aliasSetting?: string | undefined;
                    descriptionSetting?: string | undefined;
                    tagsSetting?: string[] | undefined;
                };
                _input_out: {
                    status: "ENABLED" | "DISABLED";
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                    publicKey: string;
                    walletPrivacySetting: "PUBLIC";
                    canRecoverAccountSetting: boolean;
                    source: {
                        type: "IMPORTED" | "GENERATED";
                        from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
                    };
                    authShare: string;
                    deviceShareHash: string;
                    deviceSharePublicKey: string;
                    aliasSetting?: string | undefined;
                    descriptionSetting?: string | undefined;
                    tagsSetting?: string[] | undefined;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
            }>>;
        };
        createPrivateWallet: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    status: "ENABLED" | "DISABLED";
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                    walletPrivacySetting: "PRIVATE";
                    source: {
                        type: "IMPORTED" | "GENERATED";
                        from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
                    };
                    authShare: string;
                    deviceShareHash: string;
                    deviceSharePublicKey: string;
                    aliasSetting?: string | undefined;
                    descriptionSetting?: string | undefined;
                    tagsSetting?: string[] | undefined;
                };
                _input_out: {
                    status: "ENABLED" | "DISABLED";
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                    walletPrivacySetting: "PRIVATE";
                    source: {
                        type: "IMPORTED" | "GENERATED";
                        from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
                    };
                    authShare: string;
                    deviceShareHash: string;
                    deviceSharePublicKey: string;
                    aliasSetting?: string | undefined;
                    descriptionSetting?: string | undefined;
                    tagsSetting?: string[] | undefined;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
            }>>;
        };
        createReadOnlyWallet: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    status: "READONLY" | "LOST";
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                    publicKey?: string | undefined;
                    aliasSetting?: string | undefined;
                    descriptionSetting?: string | undefined;
                    tagsSetting?: string[] | undefined;
                };
                _input_out: {
                    status: "READONLY" | "LOST";
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                    publicKey?: string | undefined;
                    aliasSetting?: string | undefined;
                    descriptionSetting?: string | undefined;
                    tagsSetting?: string[] | undefined;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
            }>>;
        };
        makeWalletPrivate: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletPrivacySetting: "PRIVATE";
                    walletId: string;
                };
                _input_out: {
                    walletPrivacySetting: "PRIVATE";
                    walletId: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
            }>>;
        };
        makeWalletPublic: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                    publicKey: string;
                    walletPrivacySetting: "PUBLIC";
                    walletId: string;
                };
                _input_out: {
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                    publicKey: string;
                    walletPrivacySetting: "PUBLIC";
                    walletId: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
            }>>;
        };
        updateWalletInfo: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                    identifierTypeSetting?: "ALIAS" | "ANS" | "PNS" | undefined;
                    aliasSetting?: string | undefined;
                    descriptionSetting?: string | undefined;
                    tagsSetting?: string[] | undefined;
                };
                _input_out: {
                    walletId: string;
                    identifierTypeSetting?: "ALIAS" | "ANS" | "PNS" | undefined;
                    aliasSetting?: string | undefined;
                    descriptionSetting?: string | undefined;
                    tagsSetting?: string[] | undefined;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
            }>>;
        };
        updateWalletRecovery: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    canRecoverAccountSetting: boolean;
                    walletId: string;
                };
                _input_out: {
                    canRecoverAccountSetting: boolean;
                    walletId: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
            }>>;
        };
        updateWalletStatus: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    status: "ENABLED" | "DISABLED" | "READONLY" | "LOST";
                    walletId: string;
                };
                _input_out: {
                    status: "ENABLED" | "DISABLED" | "READONLY" | "LOST";
                    walletId: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
            }>>;
        };
        deleteWallet: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                };
                _input_out: {
                    walletId: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {}>>;
        };
        generateWalletActivationChallenge: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                };
                _input_out: {
                    walletId: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                activationChallenge: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    value: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    version: string;
                };
            }>>;
        };
        activateWallet: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                    challengeSolution: string;
                };
                _input_out: {
                    walletId: string;
                    challengeSolution: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
                authShare: string;
                rotationChallenge: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    value: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    version: string;
                } | null;
            }>>;
        };
        rotateAuthShare: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                    authShare: string;
                    deviceShareHash: string;
                    deviceSharePublicKey: string;
                    challengeSolution: string;
                };
                _input_out: {
                    walletId: string;
                    authShare: string;
                    deviceShareHash: string;
                    deviceSharePublicKey: string;
                    challengeSolution: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                nextRotationAt: Date;
            }>>;
        };
        registerRecoveryShare: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                    recoveryAuthShare: string;
                    recoveryBackupShareHash: string;
                    recoveryBackupSharePublicKey: string;
                };
                _input_out: {
                    walletId: string;
                    recoveryAuthShare: string;
                    recoveryBackupShareHash: string;
                    recoveryBackupSharePublicKey: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
                recoveryFileServerSignature: string;
            }>>;
        };
        registerWalletExport: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                    type: "SEEDPHRASE" | "KEYFILE";
                };
                _input_out: {
                    walletId: string;
                    type: "SEEDPHRASE" | "KEYFILE";
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
            }>>;
        };
        generateWalletRecoveryChallenge: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                };
                _input_out: {
                    walletId: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                shareRecoveryChallenge: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    value: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    version: string;
                };
            }>>;
        };
        recoverWallet: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                    challengeSolution: string;
                    recoveryBackupShareHash?: string | undefined;
                    recoveryFileServerSignature?: string | undefined;
                };
                _input_out: {
                    walletId: string;
                    challengeSolution: string;
                    recoveryBackupShareHash?: string | undefined;
                    recoveryFileServerSignature?: string | undefined;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                recoveryAuthShare: null;
                recoveryBackupServerPublicKey: string;
                wallet?: undefined;
                rotationChallenge?: undefined;
            } | {
                wallet: DbWallet;
                recoveryAuthShare: string | undefined;
                rotationChallenge: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    value: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    version: string;
                };
                recoveryBackupServerPublicKey?: undefined;
            }>>;
        };
        registerAuthShare: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: {
                    walletId: string;
                    authShare: string;
                    deviceShareHash: string;
                    deviceSharePublicKey: string;
                    challengeSolution: string;
                };
                _input_out: {
                    walletId: string;
                    authShare: string;
                    deviceShareHash: string;
                    deviceSharePublicKey: string;
                    challengeSolution: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                wallet: DbWallet;
                nextRotationAt: Date;
            }>>;
        };
        generateFetchRecoverableAccountsChallenge: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: null;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                } | {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: _supabase_supabase_js.AuthUser;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                };
                _input_in: {
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                };
                _input_out: {
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                fetchRecoverableWalletsChallenge: {
                    id: string;
                    createdAt: Date;
                    chain: _prisma_client.$Enums.Chain;
                    address: string;
                    value: string;
                    version: string;
                };
            }>>;
        };
        fetchRecoverableAccounts: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: null;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                } | {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: _supabase_supabase_js.AuthUser;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                };
                _input_in: {
                    challengeId: string;
                    challengeSolution: string;
                };
                _input_out: {
                    challengeId: string;
                    challengeSolution: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                recoverableAccounts: RecoverableAccount[];
            }>>;
        };
        generateAccountRecoveryChallenge: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: null;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                } | {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: _supabase_supabase_js.AuthUser;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                };
                _input_in: {
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                    userId: string;
                };
                _input_out: {
                    chain: "ARWEAVE" | "ETHEREUM";
                    address: string;
                    userId: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                accountRecoveryChallenge: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    value: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    version: string;
                };
            }>>;
        };
        recoverAccount: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: null;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                } | {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: _supabase_supabase_js.AuthUser;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                };
                _input_in: {
                    userId: string;
                    challengeSolution: string;
                };
                _input_out: {
                    userId: string;
                    challengeSolution: string;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                userDetails: [{
                    name: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    supId: string;
                    supEmail: string | null;
                    supPhone: string | null;
                    email: string | null;
                    phone: string | null;
                    picture: string | null;
                    recoveredAt: Date | null;
                    userDetailsRecoveryPrivacy: _prisma_client.$Enums.UserDetailsPrivacySetting[];
                    notificationsSetting: _prisma_client.$Enums.NotificationSetting;
                    recoveryWalletsRequiredSetting: number;
                    ipPrivacyFilterSetting: _prisma_client.$Enums.FilterPrivacySetting | null;
                    countryPrivacySetting: _prisma_client.$Enums.FilterPrivacySetting | null;
                }, {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    value: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    version: string;
                }];
            }>>;
        };
        validateApplication: {
            query: _trpc_client.Resolver<_trpc_server.BuildProcedure<"query", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: null;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                } | {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: _supabase_supabase_js.AuthUser;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                };
                _input_in: {
                    clientId: string;
                    applicationOrigin: string;
                    sessionId?: string | undefined;
                };
                _input_out: {
                    clientId: string;
                    applicationOrigin: string;
                    sessionId?: string | undefined;
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, string>>;
        };
        debugSession: {
            query: _trpc_client.Resolver<_trpc_server.BuildProcedure<"query", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: typeof _trpc_server.unsetMarker;
                _input_out: typeof _trpc_server.unsetMarker;
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                } & {
                    applicationId: string;
                };
            }>>;
        };
        authenticate: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: null;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                } | {
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                    user: _supabase_supabase_js.AuthUser;
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                };
                _input_in: {
                    email: string;
                    authProviderType: "EMAIL_N_PASSWORD";
                    password: string;
                } | {
                    authProviderType: "PASSKEYS" | "GOOGLE" | "FACEBOOK" | "X" | "APPLE";
                };
                _input_out: {
                    email: string;
                    authProviderType: "EMAIL_N_PASSWORD";
                    password: string;
                } | {
                    authProviderType: "PASSKEYS" | "GOOGLE" | "FACEBOOK" | "X" | "APPLE";
                };
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                user: _supabase_supabase_js.AuthUser;
                url: null;
                data?: undefined;
            } | {
                user: null;
                data: string;
                url?: undefined;
            }>>;
        };
        getUser: {
            query: _trpc_client.Resolver<_trpc_server.BuildProcedure<"query", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: typeof _trpc_server.unsetMarker;
                _input_out: typeof _trpc_server.unsetMarker;
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                user: _supabase_supabase_js.AuthUser | null;
            }>>;
        };
        logout: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: typeof _trpc_server.unsetMarker;
                _input_out: typeof _trpc_server.unsetMarker;
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                success: boolean;
                message: string;
            }>>;
        };
        refreshSession: {
            mutate: _trpc_client.Resolver<_trpc_server.BuildProcedure<"mutation", {
                _config: _trpc_server.RootConfig<{
                    ctx: {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: null;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    } | {
                        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                        user: _supabase_supabase_js.AuthUser;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            deviceNonce: string;
                            ip: string;
                            userAgent: string;
                        } & {
                            applicationId: string;
                        };
                    };
                    meta: object;
                    errorShape: _trpc_server.DefaultErrorShape;
                    transformer: typeof superjson__default;
                }>;
                _meta: object;
                _ctx_out: {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                } | {
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        deviceNonce: string;
                        ip: string;
                        userAgent: string;
                    } & {
                        applicationId: string;
                    };
                    user: _supabase_supabase_js.AuthUser;
                    prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
                };
                _input_in: typeof _trpc_server.unsetMarker;
                _input_out: typeof _trpc_server.unsetMarker;
                _output_in: typeof _trpc_server.unsetMarker;
                _output_out: typeof _trpc_server.unsetMarker;
            }, {
                message: string;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    expires_at: number | undefined;
                    expires_in: number;
                };
            }>>;
        };
    };
    getAuthTokenHeader: () => string | null;
    setAuthTokenHeader: (nextAuthToken: string | null) => void;
    getDeviceNonceHeader: () => string;
    setDeviceNonceHeader: (nextDeviceNonce: string) => void;
    getClientIdHeader: () => string;
    setClientIdHeader: (nextClientId: string) => void;
    getApplicationIdHeader: () => string;
    setApplicationIdHeader: (nextApplicationId: string) => void;
};

declare function createSupabaseClient(supabaseUrl?: string, supabaseKey?: string, supabaseOptions?: SupabaseClientOptions<"public">): _supabase_supabase_js.SupabaseClient<any, "public", any>;

type ChallengeClientVersion = `v${number}`;
type ChallengeSolutionWithVersion = `${ChallengeClientVersion}.${string}`;
interface ChallengeData {
    challenge: Challenge | AnonChallenge;
    session: Session;
    shareHash: null | string;
}
interface SolveChallengeParams extends ChallengeData {
    jwk?: JWKInterface;
}
interface ChallengeClient {
    version: ChallengeClientVersion;
    importKeyAlgorithm: RsaHashedImportParams;
    signAlgorithm: RsaPssParams;
    getChallengeRawData: (data: ChallengeData) => string;
    solveChallenge: (params: SolveChallengeParams) => Promise<ChallengeSolutionWithVersion>;
}

declare const ChallengeClientV1: ChallengeClient;

export { type AppRouter, ChallengeClientV1, type DbWallet, type RecoverableAccount, type WalletInfo, type WalletSource, createSupabaseClient, createTRPCClient };
