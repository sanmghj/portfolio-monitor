import { createBrowserRouter } from 'react-router';
import { Root } from './Root';
import { LoginPage } from './pages/LoginPage';
import { PortfoliosPage } from './pages/PortfoliosPage';
import { PortfolioDetailPage } from './pages/PortfolioDetailPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { PromptsPage } from './pages/PromptsPage';

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
        Component: AnalysisPage,
      },
      {
        path: 'prompts',
        Component: PromptsPage,
      },
    ],
  },
]);
