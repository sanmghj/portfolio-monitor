import { createElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Root } from './Root';
import { LoginPage } from './pages/LoginPage';
import { PortfoliosPage } from './pages/PortfoliosPage';
import { PortfolioDetailPage } from './pages/PortfolioDetailPage';

function RedirectToPortfolio() {
  return createElement(Navigate, { to: '/', replace: true });
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/',
    Component: Root,
    children: [
      {
        index: true,
        Component: PortfoliosPage,
      },
      {
        path: 'portfolio/:portfolioId',
        Component: PortfolioDetailPage,
      },
      {
        path: 'analysis',
        Component: RedirectToPortfolio,
      },
      {
        path: 'prompts',
        Component: RedirectToPortfolio,
      },
    ],
  },
]);
