# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""One ipykernel session with execute + variable introspection."""

from __future__ import annotations

import json
from queue import Empty
from typing import List, Optional, Tuple

from jupyter_client import KernelManager

from mito_ai_core.completions.models import KernelVariable

# Run in user namespace; prints JSON array of KernelVariable-like dicts.
_VARIABLE_PROBE = """
import json
try:
    from IPython import get_ipython
    _ip = get_ipython()
    _ns = _ip.user_ns if _ip is not None else {}
except Exception:
    _ns = {}
_skip = {"In", "Out", "get_ipython"}
_out = []
for _name in sorted(_ns.keys()):
    if _name.startswith("_") or _name in _skip:
        continue
    try:
        _val = _ns[_name]
        _out.append({
            "variable_name": _name,
            "type": type(_val).__name__,
            "value": repr(_val)[:500],
        })
    except Exception:
        pass
print(json.dumps(_out))
"""


class KernelSession:
    """Starts a single kernel and exposes blocking execute + shutdown."""

    def __init__(self) -> None:
        self._km = KernelManager()
        self._km.start_kernel()
        self._kc = self._km.client()
        self._kc.start_channels()
        self._kc.wait_for_ready(timeout=120)

    def shutdown(self) -> None:
        try:
            self._kc.stop_channels()
        finally:
            try:
                self._km.shutdown_kernel(now=True)
            except Exception:
                pass

    def execute(
        self, code: str, *, timeout_s: float = 300.0
    ) -> Tuple[bool, str, Optional[str]]:
        """Run *code* in the kernel.

        Returns
        -------
        success, combined_text_output, error_message
            *error_message* is ``None`` when execution finished without a traceback.
        """
        msg_id = self._kc.execute(code)
        text_parts: List[str] = []
        error_text: Optional[str] = None

        while True:
            try:
                msg = self._kc.get_iopub_msg(timeout=timeout_s)
            except Empty:
                return False, "", "Timed out waiting for kernel iopub output"

            if msg.get("parent_header", {}).get("msg_id") != msg_id:
                continue

            msg_type = msg["msg_type"]
            content = msg["content"]

            if msg_type == "stream":
                text_parts.append(content.get("text", ""))
            elif msg_type == "error":
                error_text = "\n".join(content.get("traceback", []))
            elif msg_type == "execute_result":
                data = content.get("data", {})
                plain = data.get("text/plain")
                if plain is not None:
                    text_parts.append(plain)
            elif msg_type == "display_data":
                data = content.get("data", {})
                plain = data.get("text/plain")
                if plain is not None:
                    text_parts.append(plain)
            elif msg_type == "status" and content.get("execution_state") == "idle":
                break

        # Shell reply may contain error info even when iopub missed it.
        try:
            reply = self._kc.get_shell_msg(timeout=60)
        except Empty:
            reply = None

        if reply is not None:
            c = reply.get("content", {})
            if c.get("status") == "error":
                tb = c.get("traceback")
                if tb:
                    shell_err = "\n".join(tb)
                else:
                    shell_err = c.get("evalue", "Kernel error")
                if not error_text:
                    error_text = shell_err

        out = "".join(text_parts)
        success = error_text is None
        return success, out, error_text

    def fetch_variables(self, *, timeout_s: float = 120.0) -> List[KernelVariable]:
        """Return a simple name / type / repr view of user globals."""
        ok, out, err = self.execute(_VARIABLE_PROBE, timeout_s=timeout_s)
        if not ok or err:
            return []
        out = out.strip()
        if not out:
            return []
        try:
            raw = json.loads(out)
        except json.JSONDecodeError:
            return []
        result: List[KernelVariable] = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            name = item.get("variable_name")
            typ = item.get("type")
            if not isinstance(name, str) or not isinstance(typ, str):
                continue
            result.append(
                KernelVariable(
                    variable_name=name,
                    type=typ,
                    value=item.get("value"),
                )
            )
        return result


def default_kernel_session() -> KernelSession:
    """Factory for a new kernel session (mostly for tests)."""
    return KernelSession()
