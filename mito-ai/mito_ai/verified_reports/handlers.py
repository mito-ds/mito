# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import logging
from typing import List, Optional

import tornado
from jupyter_server.base.handlers import APIHandler
from openai.types.chat import ChatCompletionMessageParam

from mito_ai.completions.models import MessageType
from mito_ai_core.completions.prompt_builders.verified_snippet_context_prompt import (
    create_verified_snippet_context_prompt,
)
from mito_ai_core.provider_manager import ProviderManager
from mito_ai_core.verified_reports.utils import (
    add_snippet,
    create_or_update_report,
    delete_snippet,
    delete_verified_report,
    get_all_verified_reports,
    get_verified_report,
    update_snippet,
)

logger = logging.getLogger(__name__)


async def _generate_snippet_context(
    llm: ProviderManager,
    code: str,
    comment: str,
    cell_code: str,
) -> str:
    try:
        prompt = create_verified_snippet_context_prompt(code, comment, cell_code)
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": prompt}
        ]
        return await llm.request_completions(
            messages=messages,
            message_type=MessageType.CHAT,
            thread_id=None,
            use_fast_model=True,
        )
    except Exception as e:
        logger.warning("Failed to generate verified snippet context: %s", e)
        return ""


class VerifiedReportsHandler(APIHandler):
    @tornado.web.authenticated
    def get(self, report_name: Optional[str] = None) -> None:
        if report_name is None or report_name == "":
            reports = get_all_verified_reports()
            self.finish(json.dumps(reports))
            return

        try:
            report = get_verified_report(report_name)
            if report is None:
                self.set_status(404)
                self.finish(json.dumps({"error": f"Verified report '{report_name}' not found"}))
                return
            self.finish(json.dumps(report))
        except ValueError as e:
            self.set_status(400)
            self.finish(json.dumps({"error": str(e)}))

    @tornado.web.authenticated
    def put(self, report_name: str) -> None:
        data = json.loads(self.request.body)
        if "description" not in data:
            self.set_status(400)
            self.finish(json.dumps({"error": "description is required"}))
            return

        try:
            report = create_or_update_report(report_name, data["description"])
            self.finish(json.dumps({"status": "updated", "report": report}))
        except ValueError as e:
            self.set_status(400)
            self.finish(json.dumps({"error": str(e)}))

    @tornado.web.authenticated
    def delete(self, report_name: str) -> None:
        try:
            delete_verified_report(report_name)
            self.finish(json.dumps({"status": "deleted", "name": report_name}))
        except ValueError as e:
            self.set_status(400)
            self.finish(json.dumps({"error": str(e)}))


class VerifiedReportSnippetHandler(APIHandler):
    def initialize(self, llm: ProviderManager) -> None:
        super().initialize()
        self._llm = llm

    @tornado.web.authenticated
    async def post(self, report_name: str) -> None:
        data = json.loads(self.request.body)
        code = data.get("code", "")
        comment = data.get("comment", "")
        cell_code = data.get("cell_code", "")
        description = data.get("description")

        if not code.strip():
            self.set_status(400)
            self.finish(json.dumps({"error": "code is required"}))
            return
        if not comment.strip():
            self.set_status(400)
            self.finish(json.dumps({"error": "comment is required"}))
            return

        try:
            ai_context = await _generate_snippet_context(
                self._llm, code, comment, cell_code
            )
            snippet = add_snippet(
                report_name,
                code,
                comment,
                ai_context,
                description=description,
            )
            report = get_verified_report(report_name)
            self.finish(json.dumps({"status": "created", "snippet": snippet, "report": report}))
        except ValueError as e:
            self.set_status(400)
            self.finish(json.dumps({"error": str(e)}))

    @tornado.web.authenticated
    def put(self, report_name: str, snippet_id: str) -> None:
        data = json.loads(self.request.body)
        comment = data.get("comment")
        ai_context = data.get("ai_context")

        if comment is None and ai_context is None:
            self.set_status(400)
            self.finish(json.dumps({"error": "comment or ai_context is required"}))
            return

        try:
            snippet = update_snippet(
                report_name,
                snippet_id,
                comment=comment,
                ai_context=ai_context,
            )
            if snippet is None:
                self.set_status(404)
                self.finish(json.dumps({"error": "Snippet not found"}))
                return
            self.finish(json.dumps({"status": "updated", "snippet": snippet}))
        except ValueError as e:
            self.set_status(400)
            self.finish(json.dumps({"error": str(e)}))

    @tornado.web.authenticated
    def delete(self, report_name: str, snippet_id: str) -> None:
        try:
            deleted = delete_snippet(report_name, snippet_id)
            if not deleted:
                self.set_status(404)
                self.finish(json.dumps({"error": "Snippet not found"}))
                return
            self.finish(json.dumps({"status": "deleted", "snippet_id": snippet_id}))
        except ValueError as e:
            self.set_status(400)
            self.finish(json.dumps({"error": str(e)}))
