"use client"

import { lazy } from "react"

export const LazyCommentSystem = lazy(() =>
  import("./comment-system").then((module) => ({ default: module.CommentSystem })),
)

export const LazyQOMCostCalculator = lazy(() =>
  import("./qom-cost-calculator").then((module) => ({ default: module.QOMCostCalculator })),
)

export const LazyMetaMaskQL1Helper = lazy(() =>
  import("./metamask-ql1-helper").then((module) => ({ default: module.MetaMaskQL1Helper })),
)

export const LazySocialShare = lazy(() => import("./social-share").then((module) => ({ default: module.SocialShare })))
