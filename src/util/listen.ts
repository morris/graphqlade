import { Server } from "http";
import { AddressInfo } from "net";

export function listen(server: Server, port?: number) {
  server.listen(port ?? 0);

  return new Promise<number>((resolve, reject) => {
    server.on("listening", () =>
      resolve((server.address() as AddressInfo).port)
    );
    server.on("error", reject);
  });
}
