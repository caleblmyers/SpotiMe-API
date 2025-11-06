import { Router } from "express";
import userRoutes from "./api/user";
import albumsRoutes from "./api/albums";
import tracksRoutes from "./api/tracks";
import artistsRoutes from "./api/artists";
import genresRoutes from "./api/genres";
import recentlyPlayedRoutes from "./api/recently-played";

const router = Router();

// Mount route modules
router.use("/", userRoutes);
router.use("/", albumsRoutes);
router.use("/", tracksRoutes);
router.use("/", artistsRoutes);
router.use("/", genresRoutes);
router.use("/", recentlyPlayedRoutes);

export default router;
