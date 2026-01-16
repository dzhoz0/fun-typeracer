import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./Pages/Home.tsx";
import Room from "./Pages/Room.tsx";
import "./index.css"
import "@radix-ui/themes/styles.css";
import {Theme} from "@radix-ui/themes";

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
    <Theme>
        <BrowserRouter>
            <Routes>
                <Route index path="/" element={<Home />} />
                <Route path="/room/:roomId" element={<Room />} />
            </Routes>
        </BrowserRouter>
    </Theme>
);
