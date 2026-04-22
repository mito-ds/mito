import { useEffect, useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import pageStyles from "../../styles/Page.module.css";
import downloadsStyles from "../../styles/Downloads.module.css";
import { classNames } from "../../utils/classNames";

const MCP_NAME = "mito-ai";
type InstallMethod = "uv" | "pip";
type McpConfig = {
  command: string;
  args?: string[];
};

const MCP_CONFIGS: Record<InstallMethod, McpConfig> = {
  uv: {
    command: "uvx",
    args: ["mito-ai-mcp"],
  },
  pip: {
    command: "mito-ai-mcp",
  },
};

const getVSCodeInstallUrl = (config: McpConfig): string => {
  const encodedConfig = encodeURIComponent(JSON.stringify(config));
  return `https://insiders.vscode.dev/redirect/mcp/install?name=${MCP_NAME}&config=${encodedConfig}`;
};

const VSCodeInstallPage: NextPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<InstallMethod>("uv");
  const [vscodeInstallUrls, setVscodeInstallUrls] = useState({
    uv: "",
    pip: "",
  });

  useEffect(() => {
    const uvInstallUrl = getVSCodeInstallUrl(MCP_CONFIGS.uv);
    const pipInstallUrl = getVSCodeInstallUrl(MCP_CONFIGS.pip);

    const requestedMethod = new URLSearchParams(window.location.search).get("method");
    const method: InstallMethod = requestedMethod === "pip" ? "pip" : "uv";
    setSelectedMethod(method);

    setVscodeInstallUrls({
      uv: uvInstallUrl,
      pip: pipInstallUrl,
    });

    // Keep uv as the default when no method query parameter is provided.
    window.location.href = method === "pip" ? pipInstallUrl : uvInstallUrl;
  }, []);

  return (
    <>
      <Head>
        <title>Install Mito AI MCP in VS Code | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Open VS Code to install the Mito AI MCP integration."
        />
      </Head>

      <Header />

      <div className={pageStyles.container}>
        <main className={classNames(pageStyles.main, downloadsStyles.main_small)}>
          <section className={downloadsStyles.page_header}>
            <h1 className={downloadsStyles.page_title}>Opening VS Code...</h1>
            <p className={downloadsStyles.page_description}>
              If VS Code did not open automatically, use the link below.
            </p>
            <a className={pageStyles.link_with_p_tag_margins} href={vscodeInstallUrls[selectedMethod] || "#"}>
              Open VS Code install link
            </a>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default VSCodeInstallPage;
