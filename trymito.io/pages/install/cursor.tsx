import { useEffect, useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import pageStyles from "../../styles/Page.module.css";
import downloadsStyles from "../../styles/Downloads.module.css";
import { classNames } from "../../utils/classNames";
import {
  MCP_CONFIGS,
  MCP_NAME,
  InstallMethod,
  McpConfig,
} from "../../utils/mcpInstallConfig";

const getCursorInstallUrl = (config: McpConfig): string => {
  const encodedConfig = window.btoa(JSON.stringify(config));
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${MCP_NAME}&config=${encodeURIComponent(
    encodedConfig,
  )}`;
};

const CursorInstallPage: NextPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<InstallMethod>("uv");
  const [cursorInstallUrls, setCursorInstallUrls] = useState({
    uv: "",
    pip: "",
  });

  useEffect(() => {
    const uvInstallUrl = getCursorInstallUrl(MCP_CONFIGS.uv);
    const pipInstallUrl = getCursorInstallUrl(MCP_CONFIGS.pip);

    const requestedMethod = new URLSearchParams(window.location.search).get("method");
    const method: InstallMethod = requestedMethod === "pip" ? "pip" : "uv";
    setSelectedMethod(method);

    setCursorInstallUrls({
      uv: uvInstallUrl,
      pip: pipInstallUrl,
    });

    // Keep uv as the default when no method query parameter is provided.
    window.location.href = method === "pip" ? pipInstallUrl : uvInstallUrl;
  }, []);

  return (
    <>
      <Head>
        <title>Install Mito AI MCP in Cursor | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Open Cursor to install the Mito AI MCP integration."
        />
      </Head>

      <Header />

      <div className={pageStyles.container}>
        <main className={classNames(pageStyles.main, downloadsStyles.main_small)}>
          <section className={downloadsStyles.page_header}>
            <h1 className={downloadsStyles.page_title}>Opening Cursor...</h1>
            <p className={downloadsStyles.page_description}>
              If Cursor did not open automatically, use the link below.
            </p>
            <a className={pageStyles.link_with_p_tag_margins} href={cursorInstallUrls[selectedMethod] || "#"}>
              Open Cursor install link
            </a>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default CursorInstallPage;
